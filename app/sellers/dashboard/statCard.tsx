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
    0: { bg: 'from-[#ECBEE3]/20 to-transparent', border: 'border-[#ECBEE3]/40', icon: 'bg-[#ECBEE3]/20', text: 'text-[#ECBEE3]' },
    1: { bg: 'from-[#EA795B]/20 to-transparent', border: 'border-[#EA795B]/40', icon: 'bg-[#EA795B]/20', text: 'text-[#EA795B]' },
    2: { bg: 'from-[#ECE3BE]/20 to-transparent', border: 'border-[#ECE3BE]/40', icon: 'bg-[#ECE3BE]/20', text: 'text-[#ECE3BE]' },
    3: { bg: 'from-[#BEECE3]/20 to-transparent', border: 'border-[#BEECE3]/40', icon: 'bg-[#BEECE3]/20', text: 'text-[#BEECE3]' },
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