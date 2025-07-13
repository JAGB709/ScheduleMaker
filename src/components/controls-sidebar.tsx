'use client';

import { Wand2, Palette, Images } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AiScheduler from '@/components/ai-scheduler';
import CustomizationPanel from '@/components/customization-panel';
import TemplateGallery from '@/components/template-gallery';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';

interface ControlsSidebarProps {
  onAiSuggestion: (suggestion: string) => void;
}

export default function ControlsSidebar({ onAiSuggestion }: ControlsSidebarProps) {
  return (
    <>
      <SidebarHeader>
        <h2 className="text-lg font-semibold pl-2">Dashboard</h2>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <Accordion type="single" collapsible defaultValue="ai-scheduler" className="w-full">
          <AccordionItem value="ai-scheduler" className="border-b">
            <AccordionTrigger className="px-4 text-base hover:no-underline rounded-md hover:bg-sidebar-accent">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <span>AI Scheduler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <AiScheduler onSuggestion={onAiSuggestion} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="customize" className="border-b">
            <AccordionTrigger className="px-4 text-base hover:no-underline rounded-md hover:bg-sidebar-accent">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Customize</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <CustomizationPanel />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="templates" className="border-b-0">
            <AccordionTrigger className="px-4 text-base hover:no-underline rounded-md hover:bg-sidebar-accent">
              <div className="flex items-center gap-2">
                <Images className="h-5 w-5 text-primary" />
                <span>Templates</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <TemplateGallery />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>
    </>
  );
}
