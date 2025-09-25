const item = items[virtualRow.index];
if (!item) return null;
const key = getItemKey ? getItemKey(item, virtualRow.index) : virtualRow.index;

return (
            <div
              key={key}
data-index={virtualRow.index}
ref={virtualizer.measureElement}
style={{
                position: 'absolute',
                top: 0,
                left: 0,
                [horizontal ? 'left' : 'top']: virtualRow.start,
                [horizontal ? 'height' : 'width']: '100%',
              }
}
            >
{
  item && renderItem(item, virtualRow.index);
}
</div>
)
})}
      </div>
    </div>
  )
}

// Types are already exported above

// Default export for convenience
export default VirtualizedList;
