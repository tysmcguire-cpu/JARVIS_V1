'use client';
import {useEffect,type ReactNode} from 'react';
import {EditorContent,useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {Markdown} from '@tiptap/markdown';
import {Fragment,Slice} from '@tiptap/pm/model';
import {Bold,Italic,Strikethrough,Heading2,List,ListOrdered,Quote,Code,Undo2,Redo2,Type} from 'lucide-react';
export function NoteEditor({content,onChange,disabled,heading,reset=0}:{content:string;onChange:(value:string)=>void;disabled:boolean;heading?:ReactNode;reset?:number}){
 const editor=useEditor({extensions:[StarterKit.configure({link:false,underline:false,trailingNode:false,heading:{levels:[1,2,3]}}),Markdown.configure({markedOptions:{gfm:true,breaks:true}})],content,contentType:'markdown',immediatelyRender:false,shouldRerenderOnTransaction:true,editorProps:{attributes:{role:'textbox','aria-label':'Note content','aria-multiline':'true',class:'note-body'},handlePaste:(view,event)=>{
  const text=event.clipboardData?.getData('text/plain');if(text===undefined)return false;event.preventDefault();
  const nodes=text.replace(/\r\n?/g,'\n').split('\n').map(line=>view.state.schema.nodes.paragraph.create(null,line?view.state.schema.text(line):undefined));
  view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.fromArray(nodes),1,1)));return true;
 }},onUpdate:({editor})=>onChange(editor.getMarkdown())},[reset]);
 useEffect(()=>{editor?.setEditable(!disabled,false)},[editor,disabled]);
 const tools=[
  {name:'Bold',icon:Bold,active:editor?.isActive('bold'),run:()=>editor?.chain().focus().toggleBold().run()},
  {name:'Italic',icon:Italic,active:editor?.isActive('italic'),run:()=>editor?.chain().focus().toggleItalic().run()},
  {name:'Strikethrough',icon:Strikethrough,active:editor?.isActive('strike'),run:()=>editor?.chain().focus().toggleStrike().run()},
  {name:'Heading',icon:Heading2,active:editor?.isActive('heading'),run:()=>editor?.chain().focus().toggleHeading({level:2}).run()},
  {name:'Paragraph',icon:Type,active:editor?.isActive('paragraph'),run:()=>editor?.chain().focus().setParagraph().run()},
  {name:'Bulleted list',icon:List,active:editor?.isActive('bulletList'),run:()=>editor?.chain().focus().toggleBulletList().run()},
  {name:'Numbered list',icon:ListOrdered,active:editor?.isActive('orderedList'),run:()=>editor?.chain().focus().toggleOrderedList().run()},
  {name:'Quote',icon:Quote,active:editor?.isActive('blockquote'),run:()=>editor?.chain().focus().toggleBlockquote().run()},
  {name:'Inline code',icon:Code,active:editor?.isActive('code'),run:()=>editor?.chain().focus().toggleCode().run()},
  {name:'Undo',icon:Undo2,run:()=>editor?.chain().focus().undo().run()},
  {name:'Redo',icon:Redo2,run:()=>editor?.chain().focus().redo().run()},
 ];
 return <div className="rich-note-shell"><div role="toolbar" aria-label="Note formatting" className="note-toolbar">{tools.map(tool=><button key={tool.name} type="button" aria-label={tool.name} title={tool.name} aria-pressed={tool.active} disabled={disabled||!editor} onMouseDown={event=>event.preventDefault()} onClick={tool.run}><tool.icon size={15}/></button>)}</div>{heading}<div className="note-viewport" onClick={event=>{if(event.target===event.currentTarget)editor?.commands.focus('end')}}><div className="note-document"><EditorContent editor={editor}/></div></div></div>;
}
