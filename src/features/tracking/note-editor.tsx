'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {EditorContent,useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {Markdown} from '@tiptap/markdown';
import {Fragment,Slice} from '@tiptap/pm/model';
import {Bold,Italic,Strikethrough,Heading2,List,ListOrdered,Quote,Code,Undo2,Redo2,Type} from 'lucide-react';
export function NoteEditor({content,onChange,disabled,heading,reset=0}:{content:string;onChange:(value:string)=>void;disabled:boolean;heading?:ReactNode;reset?:number}){
 const viewport=useRef<HTMLDivElement>(null),[page,setPage]=useState(0),[height,setHeight]=useState(110),[documentHeight,setDocumentHeight]=useState(110);
 const editor=useEditor({extensions:[StarterKit.configure({link:false,underline:false,trailingNode:false,heading:{levels:[1,2,3]}}),Markdown.configure({markedOptions:{gfm:true,breaks:true}})],content,contentType:'markdown',immediatelyRender:false,shouldRerenderOnTransaction:true,editorProps:{attributes:{role:'textbox','aria-label':'Note content','aria-multiline':'true',class:'note-body'},handleScrollToSelection:()=>true,handlePaste:(view,event)=>{
  const text=event.clipboardData?.getData('text/plain');if(text===undefined)return false;event.preventDefault();
  const nodes=text.replace(/\r\n?/g,'\n').split('\n').map(line=>view.state.schema.nodes.paragraph.create(null,line?view.state.schema.text(line):undefined));
  view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.fromArray(nodes),1,1)));return true;
 }},onUpdate:({editor})=>onChange(editor.getMarkdown())},[reset]);
 useEffect(()=>{editor?.setEditable(!disabled,false)},[editor,disabled]);
 useEffect(()=>{
  const frame=viewport.current;if(!editor||!frame)return;
  let ticket=0;
  const measure=()=>{setHeight(Math.max(22,Math.floor(frame.clientHeight/22)*22));setDocumentHeight(editor.view.dom.scrollHeight)};
  const reveal=()=>{cancelAnimationFrame(ticket);ticket=requestAnimationFrame(()=>{measure();const caret=editor.view.coordsAtPos(editor.state.selection.head);const logical=caret.top-frame.getBoundingClientRect().top+page*height;setPage(Math.max(0,Math.floor(logical/height)))})};
  const observer=new ResizeObserver(measure);observer.observe(frame);observer.observe(editor.view.dom);measure();editor.on('selectionUpdate',reveal);editor.on('update',reveal);
  return()=>{cancelAnimationFrame(ticket);observer.disconnect();editor.off('selectionUpdate',reveal);editor.off('update',reveal)};
 },[editor,page,height]);
 const pages=Math.max(1,Math.ceil(documentHeight/height)),part=Math.min(page,pages-1);
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
 return <div className="rich-note-shell"><div role="toolbar" aria-label="Note formatting" className="note-toolbar">{tools.map(tool=><button key={tool.name} type="button" aria-label={tool.name} title={tool.name} aria-pressed={tool.active} disabled={disabled||!editor} onMouseDown={event=>event.preventDefault()} onClick={tool.run}><tool.icon size={15}/></button>)}</div>{heading}<div ref={viewport} className="note-viewport" onClick={event=>{if(event.target===event.currentTarget)editor?.commands.focus('end')}}><div className="note-page" style={{height}}><div className="note-document" style={{transform:`translateY(-${part*height}px)`}}><EditorContent editor={editor}/></div></div></div><div className="note-parts"><button type="button" disabled={part===0} onClick={()=>setPage(part-1)}>Previous section</button><span>{part+1} / {pages}</span><button type="button" disabled={part>=pages-1} onClick={()=>setPage(part+1)}>Next section</button></div></div>;
}
