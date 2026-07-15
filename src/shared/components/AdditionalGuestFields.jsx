import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { Switch } from "@/shared/components/switch";

// Renders one identity block (name + nationality + CID/passport) per occupant
// beyond the primary guest, i.e. for a party of `guests`, this renders
// `guests - 1` blocks (guest #1's identity lives on the parent form already).
const AdditionalGuestFields = ({ guests, additionalGuests, errors, onGuestChange }) => {
  const guestCount = Math.max(0, (guests || 1) - 1);
  if (guestCount === 0) return null;

  return (
    <div className="space-y-3" data-field="additionalGuests">
      {Array.from({ length: guestCount }).map((_, index) => {
        const guest = additionalGuests[index] || {
          name: "",
          isBhutanese: true,
          cid: "",
          passportNumber: "",
        };
        const guestErrors = errors?.[index] || {};
        const guestNumber = index + 2;

        const updateGuest = (patch) => {
          onGuestChange(index, { ...guest, ...patch });
        };

        return (
          <div key={index} className="grid gap-3 p-3 border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground">Guest {guestNumber}</p>

            <div className="grid gap-2">
              <Label className="text-sm">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={guest.name}
                onChange={(e) => updateGuest({ name: e.target.value })}
                placeholder="Guest's full name"
                className={`h-10 text-sm placeholder:text-muted-foreground/50 ${
                  guestErrors.name ? "border-destructive" : ""
                }`}
              />
              {guestErrors.name && (
                <p className="text-sm text-destructive">{guestErrors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm">Nationality</Label>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">Bhutanese</span>
                <Switch
                  checked={guest.isBhutanese}
                  onCheckedChange={(checked) =>
                    updateGuest({
                      isBhutanese: checked,
                      cid: checked ? guest.cid : "",
                      passportNumber: checked ? "" : guest.passportNumber,
                    })
                  }
                />
              </div>
            </div>

            {guest.isBhutanese ? (
              <div className="grid gap-2">
                <Label className="text-sm">
                  CID Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={guest.cid}
                  onChange={(e) => updateGuest({ cid: e.target.value })}
                  placeholder="11 digits"
                  maxLength={11}
                  className={`h-10 text-sm placeholder:text-muted-foreground/50 ${
                    guestErrors.cid ? "border-destructive" : ""
                  }`}
                />
                {guestErrors.cid && (
                  <p className="text-sm text-destructive">{guestErrors.cid}</p>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label className="text-sm">
                  Passport Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={guest.passportNumber}
                  onChange={(e) => updateGuest({ passportNumber: e.target.value })}
                  placeholder="Enter passport number"
                  maxLength={20}
                  className={`h-10 text-sm placeholder:text-muted-foreground/50 ${
                    guestErrors.passportNumber ? "border-destructive" : ""
                  }`}
                />
                {guestErrors.passportNumber && (
                  <p className="text-sm text-destructive">{guestErrors.passportNumber}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Resize `currentList` to exactly `guests - 1` entries, preserving whatever
// was already typed and padding with blank guest objects as needed.
export const syncAdditionalGuests = (guests, currentList) => {
  const needed = Math.max(0, (guests || 1) - 1);
  const current = currentList || [];
  if (current.length === needed) return current;
  if (current.length > needed) return current.slice(0, needed);
  const blank = () => ({ name: "", isBhutanese: true, cid: "", passportNumber: "" });
  return [...current, ...Array.from({ length: needed - current.length }, blank)];
};

// Validate additional guests; returns an array of per-guest error objects
// (empty objects where a guest has no errors), or null if there's nothing to validate.
export const validateAdditionalGuests = (guests, additionalGuests) => {
  const needed = Math.max(0, (guests || 1) - 1);
  if (needed === 0) return null;

  const list = additionalGuests || [];
  const errors = [];
  let hasError = false;

  for (let i = 0; i < needed; i++) {
    const guest = list[i] || {};
    const guestErrors = {};

    if (!guest.name || !guest.name.trim()) {
      guestErrors.name = "Guest name is required";
    }
    if (guest.isBhutanese) {
      if (!guest.cid || !guest.cid.trim()) {
        guestErrors.cid = "CID number is required for Bhutanese citizens";
      } else {
        const cid = guest.cid.trim();
        if (!/^\d{11}$/.test(cid)) {
          guestErrors.cid = "CID must be exactly 11 digits";
        } else {
          const dzongkhagCode = parseInt(cid.substring(0, 2), 10);
          if (dzongkhagCode < 1 || dzongkhagCode > 20) {
            guestErrors.cid = "Invalid Dzongkhag code (must be 01–20)";
          } else if (/^0{11}$/.test(cid)) {
            guestErrors.cid = "CID number cannot be all zeros";
          } else if (/^(\d)\1{10}$/.test(cid)) {
            guestErrors.cid = "CID number cannot be all same digits";
          }
        }
      }
    } else if (!guest.passportNumber || !guest.passportNumber.trim()) {
      guestErrors.passportNumber = "Passport number is required for non-Bhutanese guests";
    }

    if (Object.keys(guestErrors).length > 0) hasError = true;
    errors.push(guestErrors);
  }

  return hasError ? errors : null;
};

export default AdditionalGuestFields;
