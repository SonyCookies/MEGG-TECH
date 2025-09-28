import { Blend, Egg, Clock, Target } from "lucide-react";
import { EggSizeDonutChart } from "./EggSizeDonutChart";
import { StatItem } from "./StatItem";

const statItems = [
  {
    title: "Total Eggs Sorted",
    value: 100,
    icon: Egg,
    bgColor: "from-blue-500 to-blue-600",
    paddingColor: "bg-blue-400",
  },
  {
    title: "Avg. Eggs /hr",
    value: 25,
    icon: Clock,
    bgColor: "from-green-400 to-green-500",
    paddingColor: "bg-green-300",
  },
  {
    title: "Sorting Accuracy",
    value: 99.92,
    icon: Target,
    bgColor: "from-purple-400 to-purple-500",
    paddingColor: "bg-purple-300",
  },
  {
    title: "Most Common Size",
    value: "Large",
    icon: Blend,
    bgColor: "from-yellow-400 to-yellow-500",
    paddingColor: "bg-yellow-300",
  },
];

export function EggSizeStats() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Egg Distribution Doughnut Chart Placeholder */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-gray-300 shadow w-full max-w-md">
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-medium">Egg Size Distribution</h3>
        </div>

        <div className="md:size-72 mx-auto">
          <EggSizeDonutChart />
        </div>

        <div className="flex flex-col gap-2">
          <StatItem label="Jumbo" value="10%" color="#0e5f97" />
          <StatItem label="Extra Large" value="25%" color="#0e4772" />
          <StatItem label="Large" value="35%" color="#b0b0b0" />
          <StatItem label="Medium" value="20%" color="#fb510f" />
          <StatItem label="Small" value="10%" color="#ecb662" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full ">
        {statItems.map(
          ({ title, value, icon: Icon, bgColor, paddingColor }) => (
            <div
              key={title}
              className={`col-span-2 xl:col-span-2 bg-gradient-to-l ${bgColor} text-white p-6 rounded-2xl shadow flex items-center justify-between gap-4 xl:gap-8`}
            >
              <div
                className={`flex items-center justify-center p-2 rounded-full ${paddingColor}`}
              >
                <Icon className="w-12 h-12 xl:w-10 xl:h-10 animate-pulse" />
              </div>
              <div className="flex flex-col gap-2 text-end ">
                <h3 className="text-3xl font-semibold">{value}</h3>
                <span className="text-gray-50 text-sm">{title}</span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}