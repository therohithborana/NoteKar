
"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Menu, FileText, Trash2, X, Brush, Type, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [commandMenuTarget, setCommandMenuTarget] = useState<HTMLInputElement | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
    try {
      let notesToLoad: Note[] = [];
      const savedNotes = localStorage.getItem('notes-data');

      if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          if (Array.isArray(parsedNotes)) {
              notesToLoad = parsedNotes.map((note: any) => ({
                  id: note.id,
                  title: note.title,
                  type: note.type || 'text',
                  content: note.content || '',
                  drawing: note.drawing || (note.type === 'drawing' ? emptyDrawing : '')
              }));
          }
      }
      
      setNotes(notesToLoad);

      const lastActiveId = localStorage.getItem('lastActiveNoteId');
      if (lastActiveId && notesToLoad.some(n => n.id === +lastActiveId)) {
        setActiveNoteId(+lastActiveId);
      } else if (notesToLoad.length > 0) {
        setActiveNoteId(notesToLoad[0].id);
      } else {
        setActiveNoteId(null);
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setNotes([]);
        setActiveNoteId(null);
    }
  }, []);

  const activeNote = useMemo(() => {
    return activeNoteId ? notes.find(n => n.id === activeNoteId) : null;
  }, [notes, activeNoteId]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('lastActiveNoteId', activeNoteId.toString());
    } else {
      localStorage.removeItem('lastActiveNoteId');
    }
  }, [activeNoteId]);

  const saveNotes = (updatedNotes: Note[], idToUpdate?: number | null) => {
      if (typeof window !== 'undefined') {
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
          }
          debounceTimeout.current = setTimeout(() => {
            localStorage.setItem('notes-data', JSON.stringify(updatedNotes));
            if (idToUpdate !== undefined) {
              localStorage.setItem('lastActiveNoteId', idToUpdate === null ? '' : idToUpdate.toString());
            }
          }, 500);
      }
  };
  
  const createNewNote = useCallback((type: 'text' | 'drawing') => {
    const newNote = createFreshNote(type);
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    saveNotes([newNote, ...notes], newNote.id);

    if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
    }
  }, [notes, isMobileSidebarOpen]);
  
  const handleNoteChange = useCallback((field: 'title' | 'content' | 'drawing', value: string) => {
      if (activeNoteId) {
        setNotes(prev => prev.map(n => n.id === activeNoteId ? {...n, [field]: value} : n));
        saveNotes(notes.map(n => n.id === activeNoteId ? {...n, [field]: value} : n), activeNoteId);
      }
  }, [activeNoteId, notes]);

  const addNewCheckbox = useCallback(() => {
    if (activeNote && activeNote.type === 'text') {
      const newContent = activeNote.content === '' ? '- [ ] ' : activeNote.content + '\n- [ ] ';
      handleNoteChange('content', newContent);
      setTimeout(() => {
        const lines = newContent.split('\n');
        const lastInput = inputRefs.current[lines.length - 1];
        if (lastInput) {
          lastInput.focus();
        }
      }, 0);
    }
  }, [activeNote, handleNoteChange]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const currentIndex = notes.findIndex(n => n.id === activeNoteId);

        switch (e.key) {
          case 'ArrowUp':
            if (currentIndex > 0) setActiveNoteId(notes[currentIndex - 1].id);
            break;
          case 'ArrowDown':
            if (currentIndex < notes.length - 1) setActiveNoteId(notes[currentIndex + 1].id);
            break;
          case 'm':
            createNewNote('text');
            break;
          case 'c':
            addNewCheckbox();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notes, activeNoteId, createNewNote, addNewCheckbox]);

  const deleteNote = (id: number) => {
    const indexToDelete = notes.findIndex(n => n.id === id);
    if (indexToDelete === -1) return;

    const newNotes = notes.filter(n => n.id !== id);
    let newActiveId: number | null = null;
    
    if (newNotes.length > 0) {
      if (activeNoteId === id) {
        const newIndex = Math.max(0, indexToDelete - 1);
        newActiveId = newNotes[newIndex]?.id || newNotes[0].id;
      } else {
        newActiveId = activeNoteId;
      }
    }
    
    setNotes(newNotes);
    setActiveNoteId(newActiveId);
    saveNotes(newNotes, newActiveId);
};


  const handleLineChange = (index: number, newText: string) => {
    if (activeNote) {
      const lines = activeNote.content.split('\n');
      lines[index] = newText;
      handleNoteChange('content', lines.join('\n'));

      if (newText.trim() === '/') {
        setCommandMenuTarget(inputRefs.current[index]);
        setIsCommandMenuOpen(true);
      } else {
        setIsCommandMenuOpen(false);
      }
    }
  };
  
  const handleCommandSelect = (command: 'checkbox') => {
      if(commandMenuTarget && activeNote) {
        const index = inputRefs.current.findIndex(ref => ref === commandMenuTarget);
        if(index !== -1) {
            const lines = activeNote.content.split('\n');
            lines[index] = '- [ ] ';
            handleNoteChange('content', lines.join('\n'));
            setIsCommandMenuOpen(false);
            setTimeout(() => {
                inputRefs.current[index]?.focus();
            }, 0);
        }
      }
  }

  const handleCheckboxToggle = (index: number) => {
    if (activeNote) {
      const lines = activeNote.content.split('\n');
      const line = lines[index];
      if (line.startsWith('- [ ]')) {
        lines[index] = line.replace('- [ ]', '- [x]');
      } else if (line.startsWith('- [x]')) {
        lines[index] = line.replace('- [x]', '- [ ]');
      }
      handleNoteChange('content', lines.join('\n'));
    }
  };

  const handleKeyDownOnLine = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (activeNote) {
              let lines = activeNote.content.split('\n');
              const currentLine = lines[index];
              let newLine = '';

              if (currentLine.startsWith('- [ ] ') || currentLine.startsWith('- [x] ')) {
                  newLine = '- [ ] ';
              }
              
              lines.splice(index + 1, 0, newLine);
              handleNoteChange('content', lines.join('\n'));
              
              setTimeout(() => {
                  inputRefs.current[index + 1]?.focus();
              }, 0);
          }
      }

      if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
          e.preventDefault();
          if (activeNote && activeNote.content.split('\n').length > 1) {
              let lines = activeNote.content.split('\n');
              lines.splice(index, 1);
              handleNoteChange('content', lines.join('\n'));
              
              setTimeout(() => {
                  const prevInput = inputRefs.current[index - 1];
                  if (prevInput) {
                      prevInput.focus();
                      prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
                  }
              }, 0);
          }
      }
       if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowDown' && activeNote && index < activeNote.content.split('\n').length - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
  };
  
  const SidebarHeader = () => (
    <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="h-6 w-6"/>
                <h1 className="text-xl font-bold">Note कर</h1>
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

        <div className="px-4 py-2 flex items-center gap-2" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
           <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="outline" size="icon" onClick={() => createNewNote('text')}>
                      <Type className="h-4 w-4" />
                   </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Note (Alt + M)</p>
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

        <div className="flex-1 overflow-y-auto px-4 mt-2">
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

        <div className="mt-auto p-4 border-t border-border/60">
             <a href="https://x.com/therohithborana" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.602.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
                 </svg>
                 {!collapsed && <span>Made by @therohithborana</span>}
             </a>
        </div>
    </div>
  );
  
  if (!isClient) {
    return (
        <div className="flex h-screen dark bg-background items-center justify-center">
             <div className="flex flex-col items-center justify-center text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold">Loading Notes...</h2>
              </div>
        </div>
    );
  }

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
                 <div className="mt-auto p-4 border-t border-border/60 w-full flex justify-center">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a href="https://x.com/therohithborana" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.602.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
                                    </svg>
                                </a>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Made by @therohithborana</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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

      <main className="flex-1 flex flex-col px-6 md:px-12 pb-6 md:pb-12 overflow-hidden bg-background">
        <div className="flex items-center mb-4 md:hidden pt-4">
          <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
           <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(c => !c)} className="hidden md:inline-flex ml-auto">
              <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto pt-4">
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              placeholder="Untitled"
              className="text-3xl font-bold border-none focus:ring-0 shadow-none p-0 mb-4 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {activeNote.type === 'text' ? (
                 <Popover open={isCommandMenuOpen} onOpenChange={setIsCommandMenuOpen}>
                    <PopoverTrigger asChild>
                        {/* Dummy trigger, popover is controlled programmatically */}
                        <div style={{ position: 'absolute', top: commandMenuTarget?.offsetTop, left: commandMenuTarget?.offsetLeft }}></div>
                    </PopoverTrigger>
                    <div className="flex-1 flex flex-col text-base">
                      {(activeNote.content === '' ? [''] : activeNote.content.split('\n')).map((line, index) => {
                        const isTodo = line.startsWith('- [ ]') || line.startsWith('- [x]');
                        if (isTodo) {
                          const isChecked = line.startsWith('- [x]');
                          const text = line.substring(line.indexOf(']') + 2);
                          return (
                            <div key={index} className="flex items-center gap-2 mb-1">
                              <Checkbox id={`line-${index}`} checked={isChecked} onCheckedChange={() => handleCheckboxToggle(index)} />
                              <Input
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                value={text}
                                onChange={(e) => handleLineChange(index, `- [${isChecked ? 'x' : ' '}] ${e.target.value}`)}
                                onKeyDown={(e) => handleKeyDownOnLine(e, index)}
                                className={cn("flex-1 h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none", isChecked && "line-through text-muted-foreground")}
                                placeholder="To-do"
                              />
                            </div>
                          )
                        }
                        return (
                            <Input
                              key={index}
                              ref={el => inputRefs.current[index] = el}
                              type="text"
                              value={line}
                              onChange={(e) => handleLineChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDownOnLine(e, index)}
                              className="h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                              placeholder={index === 0 ? "Start writing..." : ""}
                            />
                        )
                      })}
                    </div>
                     <PopoverContent
                        className="w-60 p-1"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        side="bottom"
                        align="start"
                        style={{
                            // Position the popover relative to the input that triggered it
                            position: 'absolute',
                            top: `${(commandMenuTarget?.offsetTop || 0) + (commandMenuTarget?.offsetHeight || 0)}px`,
                            left: `${commandMenuTarget?.offsetLeft || 0}px`,
                        }}
                     >
                       <div className="flex flex-col gap-1">
                           <Button variant="ghost" className="w-full justify-start" onClick={() => handleCommandSelect('checkbox')}>
                               <CheckSquare className="mr-2 h-4 w-4" />
                               Checkbox
                           </Button>
                       </div>
                    </PopoverContent>
                </Popover>
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
            <h2 className="text-2xl font-semibold">No note selected</h2>
             <p className="text-muted-foreground">Get started by creating a new note.</p>
          </div>
        )}
      </main>
    </div>
  );
}
