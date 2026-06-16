import India from "@react-map/india";

// A beautiful, vibrant, yet muted color palette for states
const stateColors = {
  "Andhra Pradesh": "#2C3E50", "Arunachal Pradesh": "#E74C3C", "Assam": "#8E44AD",
  "Bihar": "#2980B9", "Chhattisgarh": "#27AE60", "Goa": "#F1C40F",
  "Gujarat": "#E67E22", "Haryana": "#16A085", "Himachal Pradesh": "#C0392B",
  "Jharkhand": "#9B59B6", "Karnataka": "#34495E", "Kerala": "#1ABC9C",
  "Madhya Pradesh": "#F39C12", "Maharashtra": "#D35400", "Manipur": "#3498DB",
  "Meghalaya": "#2ECC71", "Mizoram": "#1abc9c", "Nagaland": "#f1c40f",
  "Odisha": "#e74c3c", "Punjab": "#9b59b6", "Rajasthan": "#34495e",
  "Sikkim": "#f39c12", "Tamil Nadu": "#d35400", "Telangana": "#c0392b",
  "Tripura": "#16a085", "Uttar Pradesh": "#27ae60", "Uttarakhand": "#2980b9",
  "West Bengal": "#8e44ad", "Jammu and Kashmir": "#2c3e50", "Delhi": "#e67e22"
};

export default function IndiaMap({ onSelectState }) {
  // Normalize state names from the map to match our JSON data if needed
  const handleSelect = (stateName) => {
    if (!stateName) return;
    
    // Some normalization might be needed depending on what the package outputs
    let normalized = stateName;
    if (normalized === 'Jammu and Kashmir') normalized = 'Kashmir';
    if (normalized === 'Orissa') normalized = 'Odisha';
    
    onSelectState(normalized);
  };

  return (
    <div className="india-map-container" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <India
        type="select-single"
        size={500}
        mapColor="var(--surface-color)" // Fallback for states not in cityColors
        strokeColor="rgba(255, 255, 255, 0.4)" // Crisp, distinct borders
        strokeWidth={2} // Thicker boundaries for clear distinction
        hoverColor="#FF6B6B" // Vibrant hover color
        selectColor="#FF6B6B"
        hints={true}
        hintTextColor="#fff"
        hintBackgroundColor="rgba(0,0,0,0.8)"
        hintBorderRadius={8}
        cityColors={stateColors}
        onSelect={handleSelect}
      />
    </div>
  );
}
