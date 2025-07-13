'use client';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/i18n-context';

export default function TemplateGallery() {
    const { toast } = useToast();
    const { t } = useI18n();

    const handleTemplateClick = () => {
        toast({
            title: t('comingSoon'),
            description: t('templateFunctionalityComingSoon'),
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{t('selectTemplatePrompt')}</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                        <Image src="https://placehold.co/400x300.png" alt="Minimalist Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="white schedule" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">{t('templates.minimalist')}</p>
                </div>
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                         <Image src="https://placehold.co/400x300.png" alt="Corporate Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="dark calendar" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">{t('templates.corporate')}</p>
                </div>
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                         <Image src="https://placehold.co/400x300.png" alt="Creative Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="colorful planner" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">{t('templates.creative')}</p>
                </div>
                <div className="group cursor-pointer" onClick={handleTemplateClick}>
                    <div className="overflow-hidden rounded-md border border-muted group-hover:border-primary transition-colors">
                         <Image src="https://placehold.co/400x300.png" alt="Student Template" width={400} height={300} className="aspect-[4/3] object-cover group-hover:scale-105 transition-transform" data-ai-hint="study schedule" />
                    </div>
                    <p className="text-sm font-medium mt-2 text-center">{t('templates.student')}</p>
                </div>
            </div>
        </div>
    );
}
