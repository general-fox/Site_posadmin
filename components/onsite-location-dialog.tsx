"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
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
import styles from "./callback-dialog.module.css";
import ui from "./marketing.module.css";
import locationStyles from "./onsite-location-dialog.module.css";

type OnsiteLocationDialogProps = {
  selection?: OnsiteLocationSelection;
  onConfirm: (selection: OnsiteLocationSelection) => void;
  onClose: () => void;
};

const byRequestNotice = "Мы рассмотрим возможность предоставления услуги в вашем городе или регионе.";

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
  const panelRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
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

  useLayoutEffect(() => {
    const input = cityInputRef.current;
    const popup = popupRef.current;
    const panel = panelRef.current;
    if (!suggestionsVisible || !input || !popup || !panel) return;

    const viewport = window.visualViewport;
    const gap = 6;
    const viewportPadding = 12;
    const maxMenuHeight = 228;
    const usesPopover = typeof popup.showPopover === "function";
    if (usesPopover) popup.showPopover();

    const placePopup = () => {
      const field = input.getBoundingClientRect();
      const panelBounds = panel.getBoundingClientRect();
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      const above = field.top - viewportTop - gap - viewportPadding;
      const below = viewportBottom - field.bottom - gap - viewportPadding;
      const opensAbove = below < maxMenuHeight && above > below;
      const inputCenter = (field.top + field.bottom) / 2;
      const visible = inputCenter > Math.max(panelBounds.top, viewportTop)
        && inputCenter < Math.min(panelBounds.bottom, viewportBottom);

      popup.style.visibility = visible ? "visible" : "hidden";
      popup.style.left = `${field.left}px`;
      popup.style.top = `${opensAbove ? field.top - gap : field.bottom + gap}px`;
      popup.style.width = `${field.width}px`;
      popup.style.maxHeight = `${Math.max(0, Math.min(maxMenuHeight, opensAbove ? above : below))}px`;
      popup.dataset.side = opensAbove ? "above" : "below";
    };

    placePopup();
    const resizeObserver = new ResizeObserver(placePopup);
    resizeObserver.observe(panel);
    resizeObserver.observe(input);
    panel.addEventListener("scroll", placePopup);
    window.addEventListener("resize", placePopup);
    viewport?.addEventListener("resize", placePopup);
    viewport?.addEventListener("scroll", placePopup);
    return () => {
      resizeObserver.disconnect();
      panel.removeEventListener("scroll", placePopup);
      window.removeEventListener("resize", placePopup);
      viewport?.removeEventListener("resize", placePopup);
      viewport?.removeEventListener("scroll", placePopup);
      if (usesPopover && popup.matches(":popover-open")) popup.hidePopover();
    };
  }, [suggestionsVisible]);

  useEffect(() => {
    if (!suggestionsVisible || activeSuggestion < 0) return;
    const popup = popupRef.current;
    const option = suggestionsRef.current?.children[activeSuggestion];
    if (!popup || !option) return;
    const bounds = popup.getBoundingClientRect();
    const item = option.getBoundingClientRect();
    if (item.top < bounds.top) popup.scrollTop += item.top - bounds.top;
    if (item.bottom > bounds.bottom) popup.scrollTop += item.bottom - bounds.bottom;
  }, [activeSuggestion, suggestionsVisible]);

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
      <form ref={panelRef} className={styles.panel} onSubmit={submit}>
        <button aria-label="Закрыть окно" className={styles.close} type="button" onClick={dismiss}>
          <UiIcon name="close" />
        </button>

        <h2 id={titleId} className={styles.title}>Где нужно выездное сопровождение?</h2>
        <label className={styles.phoneField}>
          <span className={styles.label}>Город или регион</span>
          <select
            ref={selectRef}
            aria-describedby={isKrasnodar ? hintId : undefined}
            className={styles.fieldControl}
            name="location"
            required
            value={location}
            onChange={(event) => {
              const nextLocation = event.currentTarget.value;
              setLocation(nextLocation === "krasnodar" || isOnsiteSupportLocation(nextLocation) ? nextLocation : "");
              setCityError(false);
              hideSuggestions();
            }}
          >
            <option value="" disabled>Выберите город или регион</option>
            {ONSITE_LOCATION_OPTIONS.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            <option value="other">Другой город или регион</option>
          </select>
        </label>

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
          {suggestionsVisible && <div ref={popupRef} className={locationStyles.popup} popover="manual">
            <ul
              ref={suggestionsRef}
              className={locationStyles.suggestions}
              id={suggestionsId}
              role="listbox"
              aria-label="Подсказки по городам и регионам"
            >
              {suggestions.map((place, index) => <li
                key={place.id}
                id={`${suggestionsId}-${index}`}
                className={locationStyles.suggestion}
                role="option"
                aria-selected={index === activeSuggestion}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choosePlace(place)}
              >
                <span className={locationStyles.name}>{place.name}</span>
                {place.region && <span className={locationStyles.region}>{place.region}</span>}
              </li>)}
            </ul>
          </div>}
        </>}
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
