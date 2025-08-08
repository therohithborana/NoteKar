"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Menu, FileText, Trash2, Settings, Search, ChevronsLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";


type Note = {
  id: number;
  title: string;
  content: string;
};

const initialNotes: Note[] = [
    { id: 1, title: "Meeting Notes", content: "Discussed Q3 roadmap and new feature prioritization." },
    { id: 2, title: "Project Ideas", content: "Brainstormed ideas for the new marketing campaign." },
    { id: 3, title: "Personal Todos", content: "1. Buy groceries\n2. Schedule dentist appointment\n3. Finish reading book" },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // Load notes and opacity from localStorage on initial render
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedNotes = localStorage.getItem('notes-data');
        if (savedNotes) {
          const parsedNotes = JSON.parse(savedNotes);
          if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
            setNotes(parsedNotes);
            setActiveNote(parsedNotes[0]);
          } else {
             setNotes(initialNotes);
             setActiveNote(initialNotes[0]);
          }
        } else {
          setNotes(initialNotes);
          setActiveNote(initialNotes[0]);
        }

        const savedOpacity = localStorage.getItem('notes-opacity');
        if (savedOpacity) {
            setOpacity(parseFloat(savedOpacity));
        }
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setNotes(initialNotes);
        setActiveNote(initialNotes[0]);
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && notes.length > 0) {
      localStorage.setItem('notes-data', JSON.stringify(notes));
    }
  }, [notes]);

  // Save opacity to localStorage whenever it changes
  useEffect(() => {
      if(typeof window !== 'undefined') {
        localStorage.setItem('notes-opacity', String(opacity));
      }
  }, [opacity]);


  // Effect to handle contextual notes from extension
  useEffect(() => {
    if (typeof window !== 'undefined' && window.chrome && chrome.storage) {
      chrome.storage.local.get("newNoteContent", (data) => {
        if (data.newNoteContent) {
          const newNote: Note = {
            id: Date.now(),
            title: "New Note from page",
            content: data.newNoteContent,
          };
          setNotes(prevNotes => {
            const updatedNotes = [newNote, ...prevNotes];
            setActiveNote(newNote);
            return updatedNotes;
          });
          chrome.storage.local.remove("newNoteContent");
        }
      });
    }
  }, []);

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "Untitled Note",
      content: "",
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
    }
  };

  const deleteNote = (id: number) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNote?.id === id) {
      setActiveNote(newNotes[0] || null);
    }
  };

  const handleNoteChange = (field: 'title' | 'content', value: string) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, [field]: value };
      setActiveNote(updatedNote);
      setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n));
    }
  };
  
  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className={cn("flex flex-col h-full bg-transparent text-foreground p-4 transition-all duration-300")}>
        {!collapsed && (
          <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Notes</h1>
              <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(true)}>
                  <ChevronsLeft className="h-4 w-4"/>
              </Button>
          </div>
        )}

        {!collapsed && (
          <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 bg-secondary/30" />
          </div>
        )}

        <Button variant="outline" className={cn("w-full justify-start mb-4", collapsed && "justify-center")} onClick={createNewNote}>
            <Plus className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
            {!collapsed && <span>New Note</span>}
        </Button>
      
        <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col gap-1">
                {notes.map(note => (
                    <div key={note.id} className="group flex items-center">
                        <Button
                            variant={activeNote?.id === note.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                                setActiveNote(note);
                                if (isMobileSidebarOpen) {
                                    setIsMobileSidebarOpen(false);
                                }
                            }}
                        >
                            <FileText className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
                            {!collapsed && <span className="truncate flex-1 text-left">{note.title}</span>}
                        </Button>
                         {!collapsed && (
                           <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deleteNote(note.id)}>
                               <Trash2 className="h-4 w-4"/>
                           </Button>
                         )}
                    </div>
                ))}
            </nav>
        </div>
      
        <div className="mt-auto">
             <Button variant="ghost" className={cn("w-full justify-start", collapsed && "justify-center")} onClick={() => setIsSettingsOpen(true)}>
                <Settings className={cn("mr-2 h-4 w-4", collapsed && "mr-0")} />
                {!collapsed && <span>Settings</span>}
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen dark transition-opacity duration-300" style={{ backgroundColor: `rgba(3, 7, 18, ${opacity})` }}>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
            "hidden md:flex flex-col border-r border-border/60 transition-all duration-300 ease-in-out bg-transparent", 
            isDesktopSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
        )}
      >
        {isDesktopSidebarCollapsed ? (
             <div className="flex flex-col items-center py-4">
                <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(false)} className="mb-4">
                    <Menu className="h-5 w-5" />
                </Button>
                <SidebarContent collapsed={true} />
             </div>
        ) : (
            <SidebarContent collapsed={false} />
        )}
      </aside>

      {/* Mobile Sidebar */}
       <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-72 md:hidden bg-background">
              <SidebarContent collapsed={false} />
            </SheetContent>
          </Sheet>
      
      {/* Settings Panel */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent side="right" className="w-80 bg-background">
              <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Settings</h2>
                      <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                          <X className="h-4 w-4" />
                      </Button>
                  </div>
                  <div className="space-y-6">
                      <div className="space-y-3">
                          <Label htmlFor="transparency">Transparency</Label>
                          <Slider
                              id="transparency"
                              min={0.1}
                              max={1}
                              step={0.05}
                              value={[opacity]}
                              onValueChange={(value) => setOpacity(value[0])}
                          />
                          <p className="text-sm text-muted-foreground text-center">{(opacity * 100).toFixed(0)}%</p>
                      </div>
                  </div>
              </div>
          </SheetContent>
      </Sheet>


      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden bg-transparent">
        <div className="flex items-center mb-4 md:hidden">
          <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-4">Notes</h1>
        </div>

        {activeNote ? (
          <div className="flex-1 flex flex-col h-full">
            <Input
              value={activeNote.title}
              onChange={(e) => handleNoteChange('title', e.target.value)}
              placeholder="Untitled Note"
              className="text-3xl font-bold border-none focus:ring-0 shadow-none p-0 mb-4 h-auto bg-transparent"
            />
            <Textarea
              value={activeNote.content}
              onChange={(e) => handleNoteChange('content', e.target.value)}
              placeholder="Start writing..."
              className="flex-1 text-base border-none focus:ring-0 shadow-none p-0 resize-none bg-transparent"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No note selected</h2>
            <p className="text-muted-foreground mb-4">Create a new note or select one from the sidebar.</p>
            <Button onClick={createNewNote} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create a Note
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
