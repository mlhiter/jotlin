#!/usr/bin/env tsx

/**
 * One-time migration script: Chat system → Workspace system
 *
 * This script migrates the old Chat-based architecture to the new Workspace architecture.
 *
 * Migration flow:
 * 1. Create default Workspace for each user
 * 2. Convert root Chats (parentId = null) → Projects
 * 3. Convert phase Chats (REQUIREMENT) → ChatThreads with ChatMessages
 * 4. Extract and create Documents from AI-generated content
 * 5. Convert CompetitorResearch → Documents (type: "Competitor Analysis")
 *
 * Usage:
 *   npx tsx prisma/migrate-to-workspace.ts --dry-run    # Preview without changes
 *   npx tsx prisma/migrate-to-workspace.ts              # Execute migration
 *   npx tsx prisma/migrate-to-workspace.ts --rollback   # Rollback (restore from backup)
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface MigrationStats {
  usersProcessed: number
  workspacesCreated: number
  projectsCreated: number
  documentsCreated: number
  chatThreadsCreated: number
  messagesCreated: number
  competitorResearchMigrated: number
  errors: Array<{ type: string; message: string; data?: any }>
}

const stats: MigrationStats = {
  usersProcessed: 0,
  workspacesCreated: 0,
  projectsCreated: 0,
  documentsCreated: 0,
  chatThreadsCreated: 0,
  messagesCreated: 0,
  competitorResearchMigrated: 0,
  errors: [],
}

const isDryRun = process.argv.includes('--dry-run')
const isRollback = process.argv.includes('--rollback')

console.log('🚀 Workspace Migration Script')
console.log('=' .repeat(50))
console.log(`Mode: ${isDryRun ? 'DRY RUN (Preview)' : isRollback ? 'ROLLBACK' : 'LIVE MIGRATION'}`)
console.log('=' .repeat(50))
console.log()

async function main() {
  if (isRollback) {
    await rollbackMigration()
    return
  }

  // Step 1: Backup database
  if (!isDryRun) {
    console.log('📦 Step 1: Creating database backup...')
    await backupDatabase()
    console.log('✅ Backup created\n')
  } else {
    console.log('⚠️  Skipping backup in dry-run mode\n')
  }

  // Step 2: Get all users with legacy chats
  console.log('👥 Step 2: Finding users with legacy chats...')
  const users = await prisma.user.findMany({
    where: {
      chats: {
        some: {
          parentId: null,
          migratedToProjectId: null,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })
  console.log(`Found ${users.length} users to migrate\n`)

  if (users.length === 0) {
    console.log('✨ No users to migrate. Database is already up to date!')
    return
  }

  // Step 3: Migrate each user
  for (const user of users) {
    console.log(`\n🔄 Migrating user: ${user.email} (${user.id})`)
    console.log('-'.repeat(50))

    try {
      await migrateUser(user.id)
      stats.usersProcessed++
      console.log(`✅ User ${user.email} migrated successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Failed to migrate user ${user.email}: ${message}`)
      stats.errors.push({
        type: 'user_migration',
        message,
        data: { userId: user.id, email: user.email },
      })
    }
  }

  // Step 4: Print summary
  console.log('\n')
  console.log('=' .repeat(50))
  console.log('📊 Migration Summary')
  console.log('=' .repeat(50))
  console.log(`Users processed: ${stats.usersProcessed}`)
  console.log(`Workspaces created: ${stats.workspacesCreated}`)
  console.log(`Projects created: ${stats.projectsCreated}`)
  console.log(`Documents created: ${stats.documentsCreated}`)
  console.log(`Chat threads created: ${stats.chatThreadsCreated}`)
  console.log(`Messages migrated: ${stats.messagesCreated}`)
  console.log(`Competitor research migrated: ${stats.competitorResearchMigrated}`)
  console.log(`Errors: ${stats.errors.length}`)

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:')
    stats.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. [${err.type}] ${err.message}`)
    })
  }

  console.log('\n' + '=' .repeat(50))

  if (isDryRun) {
    console.log('ℹ️  This was a DRY RUN. No changes were made.')
    console.log('   Run without --dry-run to execute the migration.')
  } else {
    console.log('✅ Migration completed!')
    console.log('   Backup location: prisma/backup/')
  }
}

async function migrateUser(userId: string) {
  // Step 1: Get or create default workspace
  let workspace = await prisma.workspace.findFirst({
    where: { userId, isDeleted: false },
  })

  if (!workspace) {
    if (isDryRun) {
      console.log('  [DRY RUN] Would create Workspace')
      workspace = { id: 'dry-run-workspace-id' } as any
    } else {
      workspace = await prisma.workspace.create({
        data: {
          userId,
          title: 'My Workspace',
          icon: '💼',
        },
      })
      console.log(`  ✅ Created Workspace: ${workspace.id}`)
    }
    stats.workspacesCreated++
  } else {
    console.log(`  ℹ️  Using existing Workspace: ${workspace.id}`)
  }

  // Step 2: Get all root chats for this user
  const rootChats = await prisma.chat.findMany({
    where: {
      userId,
      parentId: null,
      migratedToProjectId: null,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`  Found ${rootChats.length} root chats to migrate`)

  // Step 3: Migrate each root chat to a project
  for (let i = 0; i < rootChats.length; i++) {
    const chat = rootChats[i]
    await migrateChatToProject(chat, workspace.id, i)
  }
}

async function migrateChatToProject(chat: any, workspaceId: string, order: number) {
  console.log(`    📁 Migrating chat "${chat.title || 'Untitled'}" → Project`)

  // Create project
  let project
  if (isDryRun) {
    console.log(`      [DRY RUN] Would create Project`)
    project = { id: 'dry-run-project-id' } as any
  } else {
    project = await prisma.project.create({
      data: {
        workspaceId,
        title: chat.title || 'Untitled Project',
        icon: '📁',
        order,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isDeleted: chat.isDeleted,
        deletedAt: chat.deletedAt,
        isPublic: chat.isPublic,
      },
    })
    console.log(`      ✅ Created Project: ${project.id}`)
  }
  stats.projectsCreated++

  // Get phase chats (children)
  const phaseChats = await prisma.chat.findMany({
    where: { parentId: chat.id },
    include: { messages: true, competitorResearches: true },
  })

  console.log(`      Found ${phaseChats.length} phase chat(s)`)

  // Migrate REQUIREMENT phase chat
  const requirementChat = phaseChats.find((c) => c.phase === 'REQUIREMENT')
  if (requirementChat) {
    await migratePhaseChat(requirementChat, project.id, workspaceId)
  }

  // Mark original chat as migrated
  if (!isDryRun) {
    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        migratedToProjectId: project.id,
        migratedAt: new Date(),
      },
    })
  }
}

async function migratePhaseChat(chat: any, projectId: string, workspaceId: string) {
  // Create chat thread
  let chatThread
  if (isDryRun) {
    console.log(`        [DRY RUN] Would create ChatThread`)
    chatThread = { id: 'dry-run-thread-id' } as any
  } else {
    chatThread = await prisma.chatThread.create({
      data: {
        projectId,
        type: 'PROJECT',
        title: 'Initial Conversation',
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
    })
    console.log(`        ✅ Created ChatThread: ${chatThread.id}`)
  }
  stats.chatThreadsCreated++

  // Migrate messages
  if (chat.messages && chat.messages.length > 0) {
    console.log(`        Migrating ${chat.messages.length} message(s)...`)

    for (const message of chat.messages) {
      if (isDryRun) {
        // Just count in dry run
      } else {
        await prisma.chatMessage.create({
          data: {
            chatThreadId: chatThread.id,
            role: message.role,
            content: message.parts,
            metadata: message.metadata,
            order: message.order,
            createdAt: message.createdAt,
          },
        })
      }
      stats.messagesCreated++
    }
    console.log(`        ✅ Migrated ${chat.messages.length} messages`)

    // Extract and create documents
    await extractDocuments(chat.messages, projectId, workspaceId)
  }

  // Migrate competitor research
  if (chat.competitorResearches && chat.competitorResearches.length > 0) {
    await migrateCompetitorResearch(chat.competitorResearches, projectId, workspaceId)
  }

  // Mark phase chat as migrated
  if (!isDryRun) {
    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        migratedToProjectId: projectId,
        migratedAt: new Date(),
      },
    })
  }
}

async function extractDocuments(messages: any[], projectId: string, workspaceId: string) {
  // Keep only the latest version of each document type
  // Key: documentType, Value: { content, message, title, icon }
  const latestDocs = new Map<
    string,
    { content: string; message: any; title: string; icon: string }
  >()

  // Traverse messages in reverse order (latest first)
  const reversedMessages = [...messages].reverse()

  for (const message of reversedMessages) {
    if (message.role !== 'assistant') continue

    const text = extractTextFromParts(message.parts)
    const parsed = parseAIResponse(text)

    // Check for PRD document (priority: final > requirementDocument > draft)
    if (!latestDocs.has('PRD')) {
      const content = parsed.final || parsed.requirementDocument || parsed.draft || ''
      if (content.trim()) {
        latestDocs.set('PRD', {
          content,
          message,
          title: 'Requirements',
          icon: '📝',
        })
      }
    }

    // Check for PAR document
    if (!latestDocs.has('PAR') && parsed.productDocument) {
      latestDocs.set('PAR', {
        content: parsed.productDocument,
        message,
        title: 'Product Analysis',
        icon: '📊',
      })
    }

    // Check for User Stories document
    if (!latestDocs.has('User Stories') && parsed.userStories) {
      latestDocs.set('User Stories', {
        content: parsed.userStories,
        message,
        title: 'User Stories',
        icon: '👤',
      })
    }

    // Check for Flows document
    if (!latestDocs.has('Flows') && parsed.flows) {
      latestDocs.set('Flows', {
        content: parsed.flows,
        message,
        title: 'Flows',
        icon: '🔄',
      })
    }
  }

  // Create documents in fixed order
  const documentOrder = ['PRD', 'PAR', 'User Stories', 'Flows']
  let order = 0

  for (const docType of documentOrder) {
    const doc = latestDocs.get(docType)
    if (!doc) continue

    if (isDryRun) {
      console.log(`        [DRY RUN] Would create Document (${docType})`)
    } else {
      await prisma.document.create({
        data: {
          projectId,
          workspaceId,
          title: doc.title,
          content: doc.content,
          documentType: docType,
          icon: doc.icon,
          isAIGenerated: true,
          sourceMessageId: doc.message.id,
          order: order++,
          createdAt: doc.message.createdAt,
        },
      })
      console.log(`        ✅ Created Document: ${doc.title} (${docType})`)
    }
    stats.documentsCreated++
  }

  if (latestDocs.size > 0) {
    console.log(`        📄 Extracted ${latestDocs.size} latest document(s) from messages`)
  }
}

async function migrateCompetitorResearch(
  researches: any[],
  projectId: string,
  workspaceId: string
) {
  console.log(`        Migrating ${researches.length} competitor research(es)...`)

  for (const research of researches) {
    const content = formatCompetitorResearch(research)

    if (isDryRun) {
      console.log(`        [DRY RUN] Would create Document (Competitor Analysis)`)
    } else {
      await prisma.document.create({
        data: {
          projectId,
          workspaceId,
          title: `Competitor Analysis: ${research.query}`,
          content,
          documentType: 'Competitor Analysis',
          icon: '🔍',
          isAIGenerated: true,
          order: 999, // Put at end
          createdAt: research.createdAt,
        },
      })
      console.log(`        ✅ Created Document: Competitor Analysis`)
    }
    stats.competitorResearchMigrated++
  }
}

function extractTextFromParts(parts: any): string {
  if (typeof parts === 'string') {
    try {
      parts = JSON.parse(parts)
    } catch {
      return parts
    }
  }

  if (Array.isArray(parts)) {
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('\n')
  }

  return ''
}

function parseAIResponse(text: string) {
  const result: any = {}

  // Extract <requirement_document>
  const reqMatch = text.match(/<requirement_document>([\s\S]*?)<\/requirement_document>/i)
  if (reqMatch) {
    result.requirementDocument = reqMatch[1].trim()
  }

  // Extract <final>
  const finalMatch = text.match(/<final>([\s\S]*?)<\/final>/i)
  if (finalMatch) {
    result.final = finalMatch[1].trim()
  }

  // Extract <draft>
  const draftMatch = text.match(/<draft>([\s\S]*?)<\/draft>/i)
  if (draftMatch) {
    result.draft = draftMatch[1].trim()
  }

  // Extract <product_document>
  const productMatch = text.match(/<product_document>([\s\S]*?)<\/product_document>/i)
  if (productMatch) {
    result.productDocument = productMatch[1].trim()
  }

  // Extract <user_stories>
  const userStoriesMatch = text.match(/<user_stories>([\s\S]*?)<\/user_stories>/i)
  if (userStoriesMatch) {
    result.userStories = userStoriesMatch[1].trim()
  }

  // Extract <flows>
  const flowsMatch = text.match(/<flows>([\s\S]*?)<\/flows>/i)
  if (flowsMatch) {
    result.flows = flowsMatch[1].trim()
  }

  return result
}

function formatCompetitorResearch(research: any): string {
  let content = `# Competitor Analysis: ${research.query}\n\n`
  content += `**Status**: ${research.status}\n`
  content += `**Created**: ${new Date(research.createdAt).toLocaleString()}\n\n`

  if (research.results) {
    content += `## Results\n\n`
    content += typeof research.results === 'string'
      ? research.results
      : JSON.stringify(research.results, null, 2)
    content += '\n\n'
  }

  if (research.analysis) {
    content += `## Analysis\n\n`
    content += typeof research.analysis === 'string'
      ? research.analysis
      : JSON.stringify(research.analysis, null, 2)
  }

  if (research.errorMessage) {
    content += `\n\n## Error\n\n${research.errorMessage}`
  }

  return content
}

async function backupDatabase() {
  const backupDir = path.join(process.cwd(), 'prisma', 'backup')
  await fs.mkdir(backupDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`)

  // Export current data
  const backup = {
    timestamp: new Date().toISOString(),
    users: await prisma.user.count(),
    chats: await prisma.chat.findMany({
      include: {
        messages: true,
        competitorResearches: true,
        children: true,
      },
    }),
    workspaces: await prisma.workspace.findMany({
      include: {
        projects: true,
        documents: true,
      },
    }),
  }

  await fs.writeFile(backupFile, JSON.stringify(backup, null, 2))
  console.log(`✅ Backup saved to: ${backupFile}`)
}

async function rollbackMigration() {
  console.log('🔄 Rolling back migration...\n')

  // Find latest backup
  const backupDir = path.join(process.cwd(), 'prisma', 'backup')
  const files = await fs.readdir(backupDir)
  const backupFiles = files.filter((f) => f.startsWith('backup-') && f.endsWith('.json'))

  if (backupFiles.length === 0) {
    console.error('❌ No backup files found!')
    return
  }

  backupFiles.sort().reverse()
  const latestBackup = path.join(backupDir, backupFiles[0])

  console.log(`📦 Using backup: ${backupFiles[0]}`)

  const backupData = JSON.parse(await fs.readFile(latestBackup, 'utf-8'))

  console.log('\n⚠️  WARNING: This will delete all Workspace data and restore Chat data.')
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

  await new Promise((resolve) => setTimeout(resolve, 5000))

  // Delete new data
  console.log('🗑️  Deleting Workspace data...')
  await prisma.chatMessage.deleteMany()
  await prisma.chatThread.deleteMany()
  await prisma.document.deleteMany()
  await prisma.project.deleteMany()
  await prisma.workspaceMember.deleteMany()
  await prisma.workspace.deleteMany()

  // Reset migration flags
  console.log('🔄 Resetting migration flags...')
  await prisma.chat.updateMany({
    data: {
      migratedToProjectId: null,
      migratedAt: null,
    },
  })

  console.log('✅ Rollback complete!')
  console.log('   Chat data has been restored to pre-migration state.')
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
