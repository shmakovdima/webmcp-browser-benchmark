export function ProductArt({ category, large = false }) {
  return (
    <div className={`product-art product-art--${category}${large ? ' product-art--large' : ''}`} aria-hidden="true">
      <span className="product-art__shape" />
      <span className="product-art__accent" />
    </div>
  );
}
