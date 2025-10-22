import Header from "@/components/Header";
import ReferralManager from "@/components/ReferralManager";
import { useTranslation } from 'react-i18next';

const Referral = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("referral_program")}</h1>
          <p className="text-muted-foreground mb-8">{t("referral_program_subtitle")}</p>
          
          <ReferralManager />
        </div>
      </div>
    </div>
  );
};

export default Referral;