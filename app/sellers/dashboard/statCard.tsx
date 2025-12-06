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

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center mb-4">
        <div className="bg-[#222] p-2 rounded-md">{icon}</div>
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