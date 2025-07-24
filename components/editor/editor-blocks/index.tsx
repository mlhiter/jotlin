import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react'
import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'

import { fencedCodeBlock, insertFencedCodeBlock } from './fenced-code'

const blockSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    fencedCode: fencedCodeBlock,
  },
})

const getCustomSlashMenuItems = (
  editor: typeof blockSchema.BlockNoteEditor
): DefaultReactSuggestionItem[] => {
  const defaultItems = getDefaultReactSlashMenuItems(editor)
  // Filter out the default code block item
  const filteredItems = defaultItems.filter(
    (item) => item.title !== 'Code Block'
  )

  return [...filteredItems, insertFencedCodeBlock(editor)]
}

export { blockSchema, getCustomSlashMenuItems }
