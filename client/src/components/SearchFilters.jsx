import { Search } from "lucide-react";
import { PROTOCOLS, displayProtocol } from "../constants/hardware.js";

const CATEGORIES = ["Microcontroller", "Sensor", "Development Kit", "Other"];
const STATUSES = ["Available", "Deployed"];

function SearchFilters({
  search,
  category,
  status,
  protocol,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onProtocolChange,
}) {
  return (
    <section className="filters" aria-label="Search and filters">
      <label className="search-field">
        <span className="sr-only">Search components</span>
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, architecture, protocol, location, or notes"
        />
      </label>

      <label className="select-field">
        <span>Category</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field">
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field">
        <span>Protocol</span>
        <select
          value={protocol}
          onChange={(event) => onProtocolChange(event.target.value)}
        >
          <option value="">All protocols</option>
          {PROTOCOLS.map((item) => (
            <option key={item} value={item}>
              {displayProtocol(item)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

export default SearchFilters;
