import { discoveryAgent } from '../src/mastra/agents/discovery-agent'

async function testDiscoveryAgent() {
  console.log('🚀 Testing Discovery Agent...\n')

  const productIdea = 'A note-taking app for developers with Git integration and Markdown support'

  console.log(`Product Idea: ${productIdea}\n`)
  console.log('Running Discovery Agent...\n')

  try {
    const result = await discoveryAgent.generate(
      `Analyze competitors for this product idea: ${productIdea}`
    )

    console.log('✅ Discovery Agent Result:\n')
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error)
  }
}

testDiscoveryAgent()
