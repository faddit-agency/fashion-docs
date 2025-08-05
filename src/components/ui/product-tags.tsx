interface ProductTagsProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
}

export function ProductTags({ tags, onTagClick }: ProductTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <button
          key={index}
          onClick={() => onTagClick?.(tag)}
          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
        >
          #{tag}
        </button>
      ))}
    </div>
  );
} 