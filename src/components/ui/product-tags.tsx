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
          className="px-3 py-1 bg-muted text-foreground text-sm rounded-full hover:bg-muted/80 transition-colors"
        >
          #{tag}
        </button>
      ))}
    </div>
  );
} 