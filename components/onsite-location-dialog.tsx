"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  isOnsiteSupportLocation,
  KRASNODAR_ONSITE_LABEL,
  normalizeOnsiteCity,
  ONSITE_CITY_MAX_LENGTH,
  ONSITE_LOCATION_OPTIONS,
  type OnsiteLocationSelection,
  type OnsiteSupportLocation,
} from "@/lib/onsite-support";
import { formatRussianLocation, searchRussianLocations, type RussianLocation } from "@/lib/russian-locations";
import { UiIcon } from "./ui-icon";
import { AnimatedSelect } from "./animated-select";
import { DropdownList } from "./dropdown-list";
import styles from "./callback-dialog.module.css";
import ui from "./marketing.module.css";
import locationStyles from "./onsite-location-dialog.module.css";

type OnsiteLocationDialogProps = {
  selection?: OnsiteLocationSelection;
  onConfirm: (selection: OnsiteLocationSelection) => void;
  onClose: () => void;
};

const byRequestNotice = "Мы рассмотрим возможность предоставления услуги в вашем городе или регионе.";
const cities = [
  { value: "", label: "Выберите город или регион", disabled: true },
  ...ONSITE_LOCATION_OPTIONS.map(({ id, name }) => ({ value: id, label: name })),
  { value: "other", label: "Другой город или регион" },
];

export function OnsiteLocationDialog({ selection, onConfirm, onClose }: OnsiteLocationDialogProps) {
  const savedKrasnodar = selection?.location === "other" && selection.otherCity === KRASNODAR_ONSITE_LABEL;
  const [location, setLocation] = useState<OnsiteSupportLocation | "krasnodar" | "">(
    savedKrasnodar ? "krasnodar" : selection?.location ?? "",
  );
  const [otherCity, setOtherCity] = useState(savedKrasnodar ? "" : selection?.otherCity ?? "");
  const [selectedPlace, setSelectedPlace] = useState<RussianLocation | undefined>(() => {
    return otherCity
      ? searchRussianLocations(otherCity).find((place) => formatRussianLocation(place) === otherCity)
      : undefined;
  });
  const [cityError, setCityError] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const locationId = useId();
  const titleId = useId();
  const hintId = useId();
  const errorId = useId();
  const suggestionsId = useId();
  const isOtherCity = location === "other";
  const isKrasnodar = location === "krasnodar";
  const isByRequest = isOtherCity || isKrasnodar;
  const query = otherCity.trim();
  const showByRequestNotice = isKrasnodar || (isOtherCity && !!query);
  const suggestions = useMemo(() => query.length >= 2 && !selectedPlace ? searchRussianLocations(query) : [], [query, selectedPlace]);
  const suggestionsVisible = isOtherCity && showSuggestions && suggestions.length > 0;
  const suggestionOptions = useMemo(() => suggestions.map(place => ({
    value: place.id, label: place.name, description: place.region,
  })), [suggestions]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    if (!dialog.open) dialog.showModal();
    root.style.overflow = "hidden";
    selectRef.current?.focus({ preventScroll: true });
    return () => { root.style.overflow = previousOverflow; };
  }, []);

  const hideSuggestions = () => {
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const choosePlace = (place: RussianLocation) => {
    const label = formatRussianLocation(place);
    const preset = label === KRASNODAR_ONSITE_LABEL ? "krasnodar" : place.onsiteLocation;
    hideSuggestions();
    setCityError(false);
    if (preset && preset !== "other") {
      setLocation(preset);
      setOtherCity("");
      setSelectedPlace(undefined);
      selectRef.current?.focus({ preventScroll: true });
    } else {
      setOtherCity(label);
      setSelectedPlace(place);
    }
  };

  const handleSearchKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape" && suggestionsVisible) {
      event.preventDefault();
      event.stopPropagation();
      hideSuggestions();
    } else if (event.key === "Enter" && suggestionsVisible && activeSuggestion >= 0) {
      event.preventDefault();
      choosePlace(suggestions[activeSuggestion]);
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length > 0) {
      event.preventDefault();
      setShowSuggestions(true);
      const last = suggestions.length - 1;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveSuggestion((current) => current < 0 ? (step > 0 ? 0 : last) : Math.max(0, Math.min(last, current + step)));
    }
  };

  const dismiss = () => {
    dialogRef.current?.close();
    onClose();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location) return;

    let next: OnsiteLocationSelection;
    if (location === "krasnodar") {
      next = { location: "other", otherCity: KRASNODAR_ONSITE_LABEL };
    } else if (location === "other") {
      const city = normalizeOnsiteCity(otherCity);
      if (!city) {
        setCityError(true);
        cityInputRef.current?.focus();
        return;
      }
      next = { location, otherCity: city };
    } else {
      next = { location };
    }

    dialogRef.current?.close();
    onConfirm(next);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={styles.dialog}
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault();
        if (suggestionsVisible) hideSuggestions();
        else dismiss();
      }}
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}
    >
      <form className={styles.panel} onSubmit={submit}>
        <button aria-label="Закрыть окно" className={styles.close} type="button" onClick={dismiss}>
          <UiIcon name="close" />
        </button>

        <h2 id={titleId} className={styles.title}>Где нужно выездное сопровождение?</h2>
        <div className={styles.phoneField}>
          <label htmlFor={locationId} className={styles.label}>Город или регион</label>
          <AnimatedSelect
            id={locationId} label="Город или регион" options={cities} triggerRef={selectRef}
            describedBy={isKrasnodar ? hintId : undefined}
            className={styles.fieldControl}
            name="location"
            required
            value={location}
            onChange={(nextLocation) => {
              setLocation(nextLocation === "krasnodar" || isOnsiteSupportLocation(nextLocation) ? nextLocation : "");
              setCityError(false);
              hideSuggestions();
            }}
          />
        </div>

        {isOtherCity && <>
          <label className={styles.phoneField}>
            <span className={styles.label}>Укажите свой город или регион</span>
            <input
              ref={cityInputRef}
              className={styles.fieldControl}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsVisible}
              aria-controls={suggestionsVisible ? suggestionsId : undefined}
              aria-activedescendant={suggestionsVisible && activeSuggestion >= 0 ? `${suggestionsId}-${activeSuggestion}` : undefined}
              aria-describedby={cityError ? `${hintId} ${errorId}` : hintId}
              aria-invalid={cityError || undefined}
              autoComplete="off"
              maxLength={ONSITE_CITY_MAX_LENGTH}
              name="otherCity"
              placeholder="Начните вводить название"
              required
              type="text"
              value={otherCity}
              onBlur={hideSuggestions}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleSearchKeys}
              onChange={(event) => {
                setOtherCity(event.currentTarget.value);
                setSelectedPlace(undefined);
                setShowSuggestions(true);
                setActiveSuggestion(-1);
                setCityError(false);
              }}
            />
          </label>
        </>}
        <DropdownList anchor={cityInputRef} id={suggestionsId} label="Подсказки по городам и регионам"
          open={suggestionsVisible} options={suggestionOptions} active={activeSuggestion}
          onChoose={index => choosePlace(suggestions[index])} />
        <p id={hintId} className={isByRequest ? styles.hint : undefined} aria-live="polite">
          {showByRequestNotice && byRequestNotice}
          {isOtherCity && !showByRequestNotice && <span className={locationStyles.placeholder} aria-hidden="true">
            {byRequestNotice}
          </span>}
        </p>
        {cityError && <p id={errorId} className={styles.error} role="alert">Введите город или регион.</p>}

        <button className={`${ui.primary} ${styles.submit}`} type="submit">
          {isByRequest ? "Сохранить для заявки" : "Добавить в расчёт"} <UiIcon name="arrow-right" />
        </button>
      </form>
    </dialog>
  );
}
