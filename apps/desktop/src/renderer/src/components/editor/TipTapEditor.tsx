/**
 * TipTap Editor Component
 * 
 * Rich text editor for article content using TipTap.
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect } from 'react';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    FileCode,
    Minus,
} from 'lucide-react';
import './TipTapEditor.css';

// Create lowlight instance for code highlighting
const lowlight = createLowlight(common);

// Custom Image extension with assetId attribute
const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            assetId: {
                default: null,
                parseHTML: element => element.getAttribute('data-asset-id'),
                renderHTML: attributes => {
                    if (!attributes.assetId) {
                        return {};
                    }
                    return {
                        'data-asset-id': attributes.assetId,
                    };
                },
            },
        };
    },
});

// Custom Video node extension
import { Node, mergeAttributes } from '@tiptap/core';

// Declare custom commands for TypeScript
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        video: {
            setVideo: (options: { src: string; assetId?: string }) => ReturnType;
        };
    }
}

const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            assetId: {
                default: null,
                parseHTML: element => element.getAttribute('data-asset-id'),
                renderHTML: attributes => {
                    if (!attributes.assetId) {
                        return {};
                    }
                    return {
                        'data-asset-id': attributes.assetId,
                    };
                },
            },
            controls: {
                default: true,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes, { controls: true })];
    },

    addCommands() {
        return {
            setVideo: (options: { src: string; assetId?: string }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

interface TipTapEditorProps {
    content: any;
    onChange: (content: any) => void;
    onImageUpload?: (file: File) => Promise<{ assetId: string; url: string } | null>;
    onVideoUpload?: (file: File) => Promise<{ assetId: string; url: string } | null>;
    placeholder?: string;
    editable?: boolean;
}

export function TipTapEditor({
    content,
    onChange,
    onImageUpload,
    onVideoUpload,
    placeholder = 'Start writing your article...',
    editable = true,
}: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // Use CodeBlockLowlight instead
            }),
            CustomImage.configure({
                inline: false,
                allowBase64: false,
            }),
            Video,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary-600 underline hover:text-primary-700',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    // Update content when prop changes externally
    useEffect(() => {
        if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const addLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(async () => {
        if (!editor || !onImageUpload) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const result = await onImageUpload(file);
            if (result) {
                // Insert image with assetId attribute
                editor.chain().focus().setImage({
                    src: result.url,
                    alt: file.name,
                    assetId: result.assetId,
                } as any).run();
            }
        };

        input.click();
    }, [editor, onImageUpload]);

    const addVideo = useCallback(async () => {
        if (!editor || !onVideoUpload) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const result = await onVideoUpload(file);
            if (result) {
                // Insert video with assetId attribute
                (editor.commands as any).setVideo({
                    src: result.url,
                    assetId: result.assetId,
                });
            }
        };

        input.click();
    }, [editor, onVideoUpload]);

    if (!editor) {
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="tiptap-editor border border-slate-200 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="border-b border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-1">
                {/* Text formatting */}
                <div className="flex gap-0.5 pr-2 border-r border-slate-200">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold"
                    >
                        <Bold className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic"
                    >
                        <Italic className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        active={editor.isActive('underline')}
                        title="Underline"
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        active={editor.isActive('code')}
                        title="Inline Code"
                    >
                        <Code className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Headings */}
                <div className="flex gap-0.5 pr-2 border-r border-slate-200">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <Heading3 className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Lists */}
                <div className="flex gap-0.5 pr-2 border-r border-slate-200">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Block elements */}
                <div className="flex gap-0.5 pr-2 border-r border-slate-200">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive('blockquote')}
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        active={editor.isActive('codeBlock')}
                        title="Code Block"
                    >
                        <FileCode className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        <Minus className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Alignment */}
                <div className="flex gap-0.5 pr-2 border-r border-slate-200">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        active={editor.isActive({ textAlign: 'left' })}
                        title="Align Left"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        active={editor.isActive({ textAlign: 'center' })}
                        title="Align Center"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        active={editor.isActive({ textAlign: 'right' })}
                        title="Align Right"
                    >
                        <AlignRight className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Insert */}
                <div className="flex gap-0.5 pr-2 border-r border-slate-200">
                    <ToolbarButton
                        onClick={addLink}
                        active={editor.isActive('link')}
                        title="Add Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </ToolbarButton>
                    {onImageUpload && (
                        <ToolbarButton
                            onClick={addImage}
                            title="Add Image"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </ToolbarButton>
                    )}
                    {onVideoUpload && (
                        <ToolbarButton
                            onClick={addVideo}
                            title="Add Video"
                        >
                            <VideoIcon className="w-4 h-4" />
                        </ToolbarButton>
                    )}
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo className="w-4 h-4" />
                    </ToolbarButton>
                </div>
            </div>

            {/* Bubble menu for selected text */}
            {editor && (
                <BubbleMenu editor={editor}>
                    <div className="flex gap-0.5 bg-slate-800 rounded-lg p-1 shadow-lg">
                        <BubbleButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            active={editor.isActive('bold')}
                        >
                            <Bold className="w-3.5 h-3.5" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            active={editor.isActive('italic')}
                        >
                            <Italic className="w-3.5 h-3.5" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            active={editor.isActive('underline')}
                        >
                            <UnderlineIcon className="w-3.5 h-3.5" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={addLink}
                            active={editor.isActive('link')}
                        >
                            <LinkIcon className="w-3.5 h-3.5" />
                        </BubbleButton>
                    </div>
                </BubbleMenu>
            )}

            {/* Editor content */}
            <EditorContent editor={editor} className="tiptap-content prose prose-slate max-w-none p-4 min-h-[400px] focus:outline-none" />
        </div>
    );
}

// Toolbar button component
function ToolbarButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                p-2 rounded transition-colors
                ${active ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {children}
        </button>
    );
}

// Bubble menu button component
function BubbleButton({
    onClick,
    active,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                p-1.5 rounded transition-colors
                ${active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}
            `}
        >
            {children}
        </button>
    );
}
