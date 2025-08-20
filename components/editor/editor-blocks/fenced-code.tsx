import { createReactBlockSpec } from '@blocknote/react'
import Prism, { highlight } from 'prismjs'
import { TbCode } from 'react-icons/tb'
import Editor from 'react-simple-code-editor'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { blockSchema } from './index'
import 'prismjs/themes/prism.css'

const languageOptions = [
  'js',
  'html',
  'css',
  'go',
  'c',
  'cpp',
  'rust',
  'python',
  'java',
]

// TODO: there do not load in time
languageOptions.forEach((lang) => {
  if (lang === 'js' || lang === 'html' || lang === 'css') return
  import(`prismjs/components/prism-${lang}`).catch((err) => {
    console.error(`Failed to load Prism language component for ${lang}:`, err)
  })
})

const fencedCodeBlock = createReactBlockSpec(
  {
    type: 'fencedCode',
    propSchema: {
      language: { default: 'js' },
      code: { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const language = block.props.language
      const code = block.props.code
      return (
        <div className="relative w-full rounded-md bg-foreground/5 p-2">
          <Select
            defaultValue={language}
            onValueChange={(newValue) => {
              editor.updateBlock(block, { props: { language: newValue } })
            }}>
            <SelectTrigger className="absolute right-1 top-1 z-50 h-max w-[180px] p-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Languages</SelectLabel>
                {languageOptions.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Editor
            value={code}
            onValueChange={(code) => {
              editor.updateBlock(block, { props: { code } })
            }}
            highlight={(code) =>
              highlight(code, Prism.languages[language], language)
            }
            padding={20}
            style={{
              fontSize: 16,
            }}
            textareaClassName="code-editor-textarea"
          />
        </div>
      )
    },
    parse: (element) => {
      if (
        element.tagName === 'PRE' &&
        element.children.length === 1 &&
        element.children[0].tagName === 'CODE'
      ) {
        const classList = element.children[0].className.split(' ')
        let language = ''
        classList.forEach((className) => {
          if (className.startsWith('language-')) {
            language = className.substring(9)
          }
        })
        return {
          language: language ? language : 'js',
          code: element.children[0].textContent
            ? element.children[0].textContent
            : '',
        }
      }
    },
  }
)

const insertFencedCodeBlock = (editor: typeof blockSchema.BlockNoteEditor) => ({
  title: 'Fenced Code',
  onItemClick: () => {
    editor.updateBlock(editor.getTextCursorPosition().block, {
      type: 'fencedCode',
    })
  },
  aliases: ['code'],
  group: 'Other',
  subtext: 'Used to define a block of code',
  icon: <TbCode />,
})

export { insertFencedCodeBlock, fencedCodeBlock }
