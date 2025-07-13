'use client';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function TemplateGallery() {
    const { toast } = useToast();

    const handleTemplateClick = () => {
        toast({
            title: "Coming Soon!",
            description: "Template functionality will be available in a future update.",
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Select a template to start with.</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                        <Image src="https://placehold.co/400x300.png" alt="Minimalist Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="white schedule" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">Minimalist</p>
                </div>
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                         <Image src="https://placehold.co/400x300.png" alt="Corporate Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="dark calendar" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">Corporate</p>
                </div>
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                         <Image src="https://placehold.co/400x300.png" alt="Creative Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="colorful planner" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">Creative</p>
                </div>
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                         <Image src="https://placehold.co/400x300.png" alt="Student Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="study schedule" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">Student</p>
                </div>
            </div>
        </div>
    );
}
