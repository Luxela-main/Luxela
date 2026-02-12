interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  subtext: string;
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  subtext,
  icon,
}) => {
  const changeColor =
    changeType === "positive"
      ? "text-green-500"
      : changeType === "negative"
      ? "text-red-500"
      : "text-green-500";

  const colorVariants = {
    0: { bg: 'from-[#E5E7EB]/20 to-transparent', border: 'border-[#E5E7EB]/40', icon: 'bg-[#E5E7EB]/20', text: 'text-[#E5E7EB]' },
    1: { bg: 'from-[#6B7280]/20 to-transparent', border: 'border-[#6B7280]/40', icon: 'bg-[#6B7280]/20', text: 'text-[#6B7280]' },
    2: { bg: 'from-[#D1D5DB]/20 to-transparent', border: 'border-[#D1D5DB]/40', icon: 'bg-[#D1D5DB]/20', text: 'text-[#D1D5DB]' },
    3: { bg: 'from-[#9CA3AF]/20 to-transparent', border: 'border-[#9CA3AF]/40', icon: 'bg-[#9CA3AF]/20', text: 'text-[#9CA3AF]' },
  } as const;
  
  // Determine which color variant to use based on title hash
  const variantIndex = title.length % 4 as keyof typeof colorVariants;
  const variant = colorVariants[variantIndex];

  return (
    <div className={`bg-[#1a1a1a] rounded-lg p-4 sm:p-5 border-2 border-l-4 border-l-[#8451E1] bg-gradient-to-br ${variant.bg} ${variant.border} hover:shadow-lg hover:shadow-[#8451E1]/20 transition-all cursor-pointer`}>
      <div className="flex items-center mb-4">
        <div className={`${variant.icon} p-2 rounded-md ${variant.text}`}>{icon}</div>
        <span className="ml-2 text-xs sm:text-sm text-gray-400">{title}</span>
      </div>
      <div className="mb-3">
        <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
      </div>
      <div className="flex items-center text-xs gap-2">
        <span className={`${changeColor} font-semibold`}>{change}</span>
        <span className="text-gray-500">{subtext}</span>
      </div>
    </div>
  );
}