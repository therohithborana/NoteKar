
"use client"

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Menu, FileText, Trash2, Search, X, Brush, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


const TldrawCanvas = dynamic(() => import('@/components/TldrawCanvas'), { ssr: false });

type Note = {
  id: number;
  title: string;
  type: 'text' | 'drawing';
  content: string;
  drawing: string;
};

const emptyDrawing = '{"shapes":[],"bindings":{},"assets":{}}';

const createFreshNote = (type: 'text' | 'drawing'): Note => ({
  id: Date.now(),
  title: type === 'text' ? "Untitled Note" : "New Drawing",
  type: type,
  content: "",
  drawing: type === 'drawing' ? emptyDrawing : ''
});


export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    try {
      let notesToLoad: Note[] = [];
      const savedNotes = localStorage.getItem('notes-data');

      if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
              notesToLoad = parsedNotes.map((note: any) => ({
                  id: note.id,
                  title: note.title,
                  type: note.type || 'text',
                  content: note.content || '',
                  drawing: note.drawing || (note.type === 'drawing' ? emptyDrawing : '')
              }));
          }
      }

      if (notesToLoad.length === 0) {
        const firstNote = createFreshNote('text');
        notesToLoad.push(firstNote);
        saveNotes([firstNote], firstNote.id);
      }
      
      setNotes(notesToLoad);

      const lastActiveId = localStorage.getItem('lastActiveNoteId');
      if (lastActiveId && notesToLoad.some(n => n.id === +lastActiveId)) {
        setActiveNoteId(+lastActiveId);
      } else {
        setActiveNoteId(notesToLoad[0].id);
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        const firstNote = createFreshNote('text');
        setNotes([firstNote]);
        setActiveNoteId(firstNote.id);
    }
  }, []);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('lastActiveNoteId', activeNoteId.toString());
    }
  }, [activeNoteId]);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);
  
  const createNewNote = (type: 'text' | 'drawing') => {
    const newNote = createFreshNote(type);
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    saveNotes(updatedNotes, newNote.id);

    if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = notes.findIndex(n => n.id === activeNoteId);
          if (currentIndex === -1) return;

          let nextIndex;
          if (e.key === 'ArrowUp') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : notes.length - 1;
          } else {
            nextIndex = currentIndex < notes.length - 1 ? currentIndex + 1 : 0;
          }
          setActiveNoteId(notes[nextIndex].id);
        } else if (e.key === 'm') {
          e.preventDefault();
          createNewNote('text');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notes, activeNoteId]);


  const activeNote = notes.find(n => n.id === activeNoteId);
  const saveNotes = (updatedNotes: Note[], idToUpdate?: number | null) => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('notes-data', JSON.stringify(updatedNotes));
          if (idToUpdate) {
            localStorage.setItem('lastActiveNoteId', idToUpdate.toString());
          }
      }
  };


  const deleteNote = (id: number) => {
    let newNotes = notes.filter(n => n.id !== id);
    let newActiveId: number | null = null;
    
    if (newNotes.length === 0) {
      const freshNote = createFreshNote('text');
      newNotes = [freshNote];
      newActiveId = freshNote.id;
    } else if (activeNoteId === id) {
      newActiveId = newNotes[0]?.id || null;
    } else {
      newActiveId = activeNoteId;
    }
    
    setNotes(newNotes);
    setActiveNoteId(newActiveId);
    saveNotes(newNotes, newActiveId);
  };

  const handleNoteChange = (field: 'title' | 'content' | 'drawing', value: string) => {
      if (activeNote) {
        const updatedNotes = notes.map(n => n.id === activeNoteId ? {...n, [field]: value} : n);
        setNotes(updatedNotes);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            saveNotes(updatedNotes, activeNoteId);
        }, 500);
      }
  }
  
  const handleContentKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const newText = `${value.substring(0, lineStart)}- [ ] ${value.substring(lineStart)}`;
      handleNoteChange('content', newText);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 6;
      }, 0);
    }
    if(e.altKey && e.key === 'x') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', lineStart);
      const currentLine = value.substring(lineStart, lineEnd > -1 ? lineEnd : value.length);

      let newLine = currentLine;
      if (currentLine.trim().startsWith('- [ ]')) {
        newLine = currentLine.replace('- [ ]', '- [x]');
      } else if (currentLine.trim().startsWith('- [x]')) {
        newLine = currentLine.replace('- [x]', '- [ ]');
      } else {
        return;
      }
      
      const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd > -1 ? lineEnd : value.length);
      handleNoteChange('content', newText);
    }
  };


  const SidebarHeader = () => (
    <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="h-6 w-6"/>
                <h1 className="text-xl font-bold">Notes</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden">
                <X className="h-5 w-5" />
            </Button>
        </div>
    </div>
  );

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className={cn("flex flex-col h-full bg-background text-foreground transition-all duration-300")}>
       {!collapsed ? <SidebarHeader /> : null}

        {!collapsed && (
          <div className="relative mb-2 px-4">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 bg-secondary/30" />
          </div>
        )}

        <div className="px-4 flex items-center gap-2" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
           <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="outline" size="icon" onClick={() => createNewNote('text')}>
                      <Type className="h-4 w-4" />
                   </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="outline" size="icon" onClick={() => createNewNote('drawing')}>
                      <Brush className="h-4 w-4" />
                   </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Drawing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>


        <div className="flex-1 overflow-y-auto px-4 mt-4">
            <nav className="flex flex-col gap-1">
                {notes.map(note => (
                    <div key={note.id} className="group relative flex items-center">
                        <Button
                            variant={activeNoteId === note.id ? "secondary" : "ghost"}
                            className="w-full justify-start pl-2 pr-8"
                            onClick={() => {
                                setActiveNoteId(note.id);
                                if (isMobileSidebarOpen) {
                                    setIsMobileSidebarOpen(false);
                                }
                            }}
                        >
                            {note.type === 'drawing' ? (
                                <Brush className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
                            ) : (
                                <FileText className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
                            )}
                            {!collapsed && <span className="truncate flex-1 text-left">{note.title}</span>}
                        </Button>
                         {!collapsed && (
                           <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteNote(note.id);}}>
                               <Trash2 className="h-4 w-4"/>
                           </Button>
                         )}
                    </div>
                ))}
            </nav>
        </div>

        <div className="mt-auto p-4">
        </div>
    </div>
  );
  
    const MarkdownRenderer = ({ content, onCheckboxToggle }: { content: string, onCheckboxToggle: (lineIndex: number, checked: boolean) => void }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: ({ checked, ...props }) => {
            const line = props.node?.position?.start.line;
            if (line === undefined) return <input type="checkbox" {...props} />;
            
            return (
              <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onCheckboxToggle(line -1, e.target.checked)}
                className="mx-2"
              />
            );
          },
          p: ({children}) => <p className="mb-2">{children}</p>
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };
  
    const handleCheckboxToggle = (lineIndex: number, checked: boolean) => {
    if (activeNote) {
      const lines = activeNote.content.split('\n');
      if (lines[lineIndex]) {
        lines[lineIndex] = checked 
          ? lines[lineIndex].replace('- [ ]', '- [x]')
          : lines[lineIndex].replace('- [x]', '- [ ]');
        handleNoteChange('content', lines.join('\n'));
      }
    }
  };

  return (
    <div className="flex h-screen dark bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
            "hidden md:flex flex-col border-r border-border/60 transition-all duration-300 ease-in-out bg-background",
            isDesktopSidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {isDesktopSidebarCollapsed ? (
             <div className="flex flex-col items-center py-4 h-full">
                <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(false)} className="mb-4">
                    <Menu className="h-5 w-5" />
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={() => createNewNote('text')} className="mb-2">
                          <Type className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New Note</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={() => createNewNote('drawing')} className="mb-2">
                          <Brush className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New Drawing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1 overflow-y-auto flex flex-col items-center gap-2 w-full px-2">
                   {notes.map(note => (
                     <div key={note.id} className="w-full relative group">
                       <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant={activeNoteId === note.id ? "secondary" : "ghost"} size="icon" className="w-full" onClick={() => setActiveNoteId(note.id)}>
                                {note.type === 'drawing' ? <Brush className="h-5 w-5"/> : <FileText className="h-5 w-5"/>}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{note.title}</p>
                          </TooltipContent>
                        </Tooltip>
                       </TooltipProvider>
                        <Button variant="destructive" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => {e.stopPropagation(); deleteNote(note.id)}}>
                           <Trash2 className="h-3 w-3"/>
                       </Button>
                     </div>
                   ))}
                </div>
                <div className="mt-auto">
                </div>
             </div>
        ) : (
            <SidebarContent collapsed={false} />
        )}
      </aside>

      {/* Mobile Sidebar */}
       <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72 md:hidden bg-background">
              <SheetHeader className="hidden">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>Notes and settings</SheetDescription>
              </SheetHeader>
              <SidebarContent collapsed={false} />
            </SheetContent>
          </Sheet>

      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden bg-background">
        <div className="flex items-center mb-4 md:hidden">
          <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
           <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(c => !c)} className="hidden md:inline-flex ml-auto">
              <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {isClient && activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              placeholder="Untitled"
              className="text-3xl font-bold border-none focus:ring-0 shadow-none p-0 mb-4 h-auto bg-transparent"
            />
            {activeNote.type === 'text' ? (
                <div className="flex-1 flex flex-col text-base" onClick={() => setIsEditing(true)}>
                {isEditing ? (
                   <Textarea
                     ref={textareaRef}
                     value={activeNote.content || ''}
                     onChange={(e) => {
                       handleNoteChange('content', e.target.value);
                       e.target.style.height = 'auto';
                       e.target.style.height = `${e.target.scrollHeight}px`;
                     }}
                     onKeyDown={handleContentKeyDown}
                     onBlur={() => setIsEditing(false)}
                     placeholder="Start writing..."
                     className="flex-1 w-full text-base border-none focus:ring-0 shadow-none p-0 bg-transparent resize-none"
                   />
                ) : (
                    <div className="prose prose-invert max-w-none flex-1">
                      <MarkdownRenderer content={activeNote.content || 'Start writing...'} onCheckboxToggle={handleCheckboxToggle} />
                    </div>
                )}
                </div>
            ) : (
                <div className="flex-1 min-h-[400px] relative border rounded-lg overflow-hidden">
                   <TldrawCanvas
                       persistenceKey={`note-drawing-${activeNote.id}`}
                       initialData={activeNote.drawing}
                       onSave={(data) => handleNoteChange('drawing', data)}
                   />
               </div>
            )}
          </div>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">Loading Notes...</h2>
          </div>
        )}
      </main>
    </div>
  );
}

    