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
    <div className={`bg-[#1a1a1a] rounded-lg p-4 border-2 border-l-4 border-l-[#8451E1] bg-gradient-to-br ${variant.bg} ${variant.border} hover:shadow-lg transition-all`}>
      <div className="flex items-center mb-4">
        <div className={`${variant.icon} p-2 rounded-md ${variant.text}`}>{icon}</div>
        <span className="ml-2 text-sm text-gray-400">{title}</span>
      </div>
      <div className="mb-2">
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="flex items-center text-xs">
        <span className={changeColor}>{change}</span>
        <span className="ml-2 text-gray-400">{subtext}</span>
      </div>
    </div>
  );
}