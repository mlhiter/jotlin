import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileReplaceButton,
  FormattingToolbar,
  NestBlockButton,
  TextAlignButton,
  UnnestBlockButton,
} from '@blocknote/react'

import { CommentButton } from './comment-button'

export const formattingToolbar = () => (
  <FormattingToolbar>
    <BlockTypeSelect key={'blockTypeSelect'} />

    <FileCaptionButton key={'fileCaptionButton'} />
    <FileReplaceButton key={'replaceFileButton'} />

    <BasicTextStyleButton basicTextStyle={'bold'} key={'boldStyleButton'} />
    <BasicTextStyleButton basicTextStyle={'italic'} key={'italicStyleButton'} />
    <BasicTextStyleButton basicTextStyle={'underline'} key={'underlineStyleButton'} />
    <BasicTextStyleButton basicTextStyle={'strike'} key={'strikeStyleButton'} />
    <BasicTextStyleButton basicTextStyle={'code'} key={'codeStyleButton'} />

    <TextAlignButton textAlignment={'left'} key={'textAlignLeftButton'} />
    <TextAlignButton textAlignment={'center'} key={'textAlignCenterButton'} />
    <TextAlignButton textAlignment={'right'} key={'textAlignRightButton'} />

    <ColorStyleButton key={'colorStyleButton'} />

    <NestBlockButton key={'nestBlockButton'} />
    <UnnestBlockButton key={'unnestBlockButton'} />

    <CreateLinkButton key={'createLinkButton'} />
    <CommentButton key={'commentButton'} />
  </FormattingToolbar>
)
