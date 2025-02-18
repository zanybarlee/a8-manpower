
export const Separator = ({ text }: { text: string }) => {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-gray-500">{text}</span>
      </div>
    </div>
  );
};
