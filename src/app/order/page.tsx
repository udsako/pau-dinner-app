"use client";
// src/app/order/page.tsx

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { MenuItem, Course } from "@/types";
import { menuAPI, ordersAPI, courseAPI } from "@/lib/api";

// ─── Full Final Year Student List ─────────────────────────────────────────────
const STUDENT_LIST = [
  "Rhoda Atoe", "Marvelous Edoho", "Toluwani BensonAjayi", "Daniella AgborAgabi",
  "Oyindamola OluOmoniyi", "Paulina Ejiofor", "Anjolajesu Ladigbolu", "Anastasia Oladokun",
  "Oluwatofunmi Oyewunmi", "Nneoma Ekechi", "Omokafe Akpe", "Oluwaseun Kasunmu",
  "Anyanwor Chukwuemeka", "Neme Delvin", "Emmanuel IbikunleAina", "Oluseye AjoseAdeogun",
  "Sheriffdeen Sheriff", "Zebada BenjaminsLaniyi", "Oluwasayo Olageshin", "Ibukunoluwa Oguntuga",
  "Oluwalonimi Oloyede", "Joseph Oigbochie", "Donald Ohanugo", "Clinton Okpara",
  "Ndifrekeabasi Etukudoh", "Mirireoluwa Olukanni", "Faheema Abdulaziz", "Abdulmalik Memud",
  "Chibuikem Okpala", "Ifeoluwa Efunbote", "Alhameen Mohammed", "Teslim Mohammed",
  "Olatunde Sanusi", "Collins Anyoha", "Omobonikeoluwa SegunShelleh", "Ofuche Ajah",
  "Emmanuel Odey", "Chioma Arinze", "Paul Ekwueme", "Debola Faseluka",
  "Peter Ekwueme", "Samuel Ajayi", "Chidera Nwanze", "RehwaOma Chikere",
  "Dorcas Elijah", "David Ohanwadi", "Grace Ezulu", "Jasmine Omeike",
  "Nolan Ogbuagu", "Charlyn Ukpere", "Oluwatishe Oluwaseun", "Osagie Osazuwa",
  "Oladimeji Abaniwonnda", "Mfonabasi Umoh", "Femi Totoyi", "Adetunbi Adeniyi",
  "Betse Unaam", "Tamilore Banjo", "Sharon Aguiyi", "Abdullah Allison",
  "Joshua Akpe", "Etomchukwu BobbyUmeano", "Nelson Edih", "Abdur-Rahman Salami",
  "Moyosoreoluwa Adeniyi", "Onyinye Okoji", "Blessing Sako", "Andikan NtiaJames",
  "Chidinma Ugwuogbe", "Ayanfeoluwanimi Oladapo", "Michael Atuorah", "Benjamin David",
  "Toluwaninse Odewabi", "Oluwawemimo Olayiwola", "Chukwunkemka Nwagbara", "Daniella Ogunlana",
  "Alheri OlayebiEdward", "Anthonia Origho", "Michael Okeke", "Oluwadamilola Oyewole",
  "Chioma Osuji", "Ifunanya Egwuatu", "Iretemide Oke", "Ighodalo Aimankhu",
  "Ayomide Ojikutu", "Paulette PacksonEnajerho", "Irene Dim", "Chiazo Ugwu",
  "Daniel Ogah", "Onyinyechi Godwin", "Godsgift Ifeanyi", "Anthony Ibuzo",
  "Opemipo Ashiru", "Yemoghor Ifesemen", "Funke Tayo", "Jennifer Nwachukwu",
  "Giovanni Abanum", "Frances Ugwumadu", "Ibukunoluwa Afolabi", "Chukwuma Ngwoke",
  "Deborah Dossou", "Olivia Ezeh", "Ekenedilichukwu Ubah", "Ayomikun Owope",
  "Chiamaka Mba", "Oreoluwa Temitayo", "Emmanuella Ojadi", "Aaleeyah Tella",
  "Manuela Manuel", "Elvis Ebenuwah", "Favour Olisa", "Ebehiroboi Adagbasa",
  "Evelyn Nwaonumah", "Meymunah Olajobi", "Nicholas Iheanacho", "Joshua Asekhauno",
  "Kamilah Salami", "Henry Nwachukwu", "Makuochukwu Ilekuba", "Henry Okwudili",
  "Oyichi Ugwunweze", "Somtochukwu Ujunwa", "Sarat Mustapha", "Zedeka Icha",
  "Nusirat Abdulrazaq", "Rehannat Abiodun", "Oluwatosin Obisanya", "Chizzy Okafor",
  "Toni Ikube", "Eghoghokose Oguns", "Airat Olanrewaju", "Blossom Abone",
  "Ayanfeoluwa Oyetunji", "Muizah Apampa", "Mardiyyah Apampa", "Francisca Nkafor",
  "Nneoma Osuji", "Larrissa Udeani", "Sophia PoBariSoter", "Vivian Abah",
  "Toluwanimi Adeyemo", "Malinna Onuorah", "Sharon Yakubu", "Ebubechi Ohabuike",
  "Nnaemeka Opara", "Aiwanose Ojeaga", "Stephanie Barnabas", "Victor Kpajie",
  "Ruth Olotu", "Derin Adesina", "Faiza Sanni", "Azeeza Runmonkun",
  "Zarah Osaretin", "Precious Itodo", "Oselumese Agbonrofo", "Cynthia Isaacs",
  "Chibusonma Obinna-Dike", "Adefolarin Lipede", "Ibukunoluwa Adeshina", "Moyinoluwa Adeyeri",
  "Precious Ivie Eremionkhale", "Awele Chizim", "Victoria Bewaji", "Samira Tswanya",
  "Deborah Oluwagbemiga", "Enoabasi Akpata", "Chelsea Ogunyemi", "Paula Irabor",
  "Nmesomachukwu Onyeka", "Leelabari TombariMenegbo", "Ekenedirichukwu Akabogu", "Teniola Tedlance",
  "Temitope Sadiq", "Kemnachi UbaDike", "Alicia Apeh", "Baridule TombariMenegbo",
  "Anita Iye-Osagie", "Chukwudalu Orafu", "Emmanuella Nnaemeka", "Kosisochukwu Ajufo",
  "Moses Onerhime", "Maryann Omoregbe", "Jaachimma AmadiObi", "Zeal Afolabi",
  "Eseabasi Ukwat", "Olaoluwakiishi Lewis", "Therese Mbama", "Munachim Ezeani",
  "Oghosa Onaghinon", "Daniel Umoru", "Liliana Amaefuna", "Tife Shote",
  "Somtochukwu Onodingene", "Kaosi Okwuadi", "Oseremen Ebare", "Aishah Bakare",
  "Sore Oliwo", "Adebare Adesokan", "David Udenkwo", "Moyo Junaid",
  "Basit Inaolaji", "Christopher Amaechi", "Tobechukwu Ofili", "Ifedayo Osinowo",
  "Kosisochukwu Nebolisa", "Esther Akindele", "Chinemerem Nnadi", "Solisama Anyanwu-ndulewe",
  "Lotachi Okpareke", "Ifeoluwa Durotimi", "Kimberly Esekody", "Chini Akalonu",
  "Uchechukwu ObiOkafor", "Feyi Ajuwape", "Ajisomo Ayeni", "Oluwatamilore Adeyemi",
  "Ayoade Marzooq Rotimi", "Onyedika Igwe Stanley", "Anita Ashade", "Divine Chidera Ndukwe",
  "Tioluwani Ige-Jones", "Adanna Favour Ohakwe", "Chinemerem David Ugo-nwosu", "Babajide Arogundade",
  "Pius Ndukwu", "Oseiga Osara", "Omowonuola Adekaka", "Ang Ogeleka",
  "Fuad Sodia", "Precious Uwadone", "Tomilola Ojosipe", "Kamsy Ben Ugwu",
  "Dieko Afolayan", "Jason Edoho", "Gabriella AgborAgabi", "Eniola Isola",
  "Farouq Sodia", "Abdulrazaq Femi-Sunmonu",
];

const COURSE_LABELS: Record<Course, { label: string; emoji: string; next: string }> = {
  STARTER: { label: "Starter", emoji: "🥗", next: "Main Course" },
  MAIN: { label: "Main Course", emoji: "🍽️", next: "Dessert" },
  DESSERT: { label: "Dessert", emoji: "🍰", next: "" },
};

const COURSE_ORDER: Course[] = ["STARTER", "MAIN", "DESSERT"];

export default function OrderPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [tableNumber, setTableNumber] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [openCourses, setOpenCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [orderedCourses, setOrderedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameEntered, setNameEntered] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseRes: any = await courseAPI.getActive();
        const courses = Array.isArray(courseRes)
          ? courseRes
          : Array.isArray(courseRes?.openCourses)
          ? courseRes.openCourses
          : [];
        setOpenCourses(courses);
        const savedName = localStorage.getItem("pau_dinner_name");
        const savedTable = localStorage.getItem("pau_dinner_table");
        if (savedName && STUDENT_LIST.some(s => s.toLowerCase() === savedName.toLowerCase())) {
          setStudentName(savedName);
          setNameConfirmed(true);
        }
        if (savedTable) setTableNumber(savedTable);
      } catch {
        toast.error("Failed to load. Please refresh.");
        setOpenCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        nameInputRef.current && !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (value: string) => {
    setStudentName(value);
    setNameConfirmed(false);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = value.toLowerCase();
    const filtered = STUDENT_LIST.filter((name) =>
      name.toLowerCase().includes(query)
    ).slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSelectSuggestion = (name: string) => {
    setStudentName(name);
    setNameConfirmed(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const checkStudentStatus = async () => {
    const name = studentName.trim();
    const tableNum = parseInt(tableNumber);

    if (!name) { toast.error("Please enter your full name."); return; }

    // Validate name is on the list
    const isOnList = STUDENT_LIST.some(
      (s) => s.toLowerCase() === name.toLowerCase()
    );
    if (!isOnList) {
      toast.error("Your name was not found on the final year list. Please select your full name from the dropdown.", { duration: 4000 });
      setNameConfirmed(false);
      return;
    }

    if (!tableNumber || isNaN(tableNum) || tableNum < 1 || tableNum > 24) {
      toast.error("Please enter a valid table number (1–24)."); return;
    }

    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/orders/student-status?studentName=${encodeURIComponent(name)}&tableNumber=${tableNum}`);
      const data = await res.json();
      const alreadyOrdered: Course[] = Array.isArray(data.orderedCourses) ? data.orderedCourses : [];
      setOrderedCourses(alreadyOrdered);

      let nextCourse: Course | null = null;
      for (const course of COURSE_ORDER) {
        if (!openCourses.includes(course)) continue;
        if (alreadyOrdered.includes(course)) continue;
        const courseIndex = COURSE_ORDER.indexOf(course);
        const previousCourses = COURSE_ORDER.slice(0, courseIndex);
        const missingPrevious = previousCourses.find((c) => !alreadyOrdered.includes(c));
        if (missingPrevious) continue;
        nextCourse = course;
        break;
      }

      setCurrentCourse(nextCourse);

      if (nextCourse) {
        const menuRes: any = await menuAPI.getAll(nextCourse);
        const grouped = menuRes?.grouped;
        setMenu(grouped && typeof grouped === "object" ? grouped : {});
      }

      localStorage.setItem("pau_dinner_name", name);
      localStorage.setItem("pau_dinner_table", String(tableNum));
      setNameEntered(true);
    } catch {
      toast.error("Failed to check your status. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSelect = (category: string, itemId: string) => {
    setSelected((prev) => ({ ...prev, [category]: itemId }));
    setSelectedVariants((prev) => { const u = { ...prev }; delete u[itemId]; return u; });
  };

  const handleVariantSelect = (menuItemId: string, variant: string) => {
    setSelectedVariants((prev) => ({ ...prev, [menuItemId]: variant }));
  };

  const handleSubmit = async () => {
    const tableNum = parseInt(tableNumber);
    const selectedItems = Object.values(selected).filter(Boolean);
    if (selectedItems.length === 0) { toast.error("Please select at least one item."); return; }

    const allMenuItems = Object.values(menu || {}).flat() as MenuItem[];
    for (const itemId of selectedItems) {
      const menuItem = allMenuItems.find((m) => m.id === itemId);
      if (menuItem?.variants && menuItem.variants.length > 0) {
        if (!selectedVariants[itemId]) {
          toast.error(`Please choose an option for "${menuItem.name}".`); return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res: any = await ordersAPI.place({
        studentName: studentName.trim(),
        tableNumber: tableNum,
        items: selectedItems.map((itemId) => ({
          menuItemId: itemId,
          variant: selectedVariants[itemId] || null,
        })),
        specialNotes: specialNotes.trim() || undefined,
      });

      toast.success("Order placed!");
      router.push(
        `/confirmation?orderId=${res.order.id}&name=${encodeURIComponent(res.order.studentName)}&table=${tableNum}&course=${currentCourse}`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
      setSubmitting(false);
    }
  };

  const courseInfo = currentCourse ? COURSE_LABELS[currentCourse] : null;

  const getStatusMessage = () => {
    if ((openCourses || []).length === 0) return { title: "Ordering is Closed", body: "Please wait for the announcement.", emoji: "⏸" };
    const allOrderedOrNotOpen = COURSE_ORDER.every((c) => (orderedCourses || []).includes(c) || !(openCourses || []).includes(c));
    if (allOrderedOrNotOpen) {
      const nextUnopenCourse = COURSE_ORDER.find((c) => !(orderedCourses || []).includes(c) && !(openCourses || []).includes(c));
      if (nextUnopenCourse) {
        return {
          title: "You're all caught up!",
          body: `You've ordered everything that's currently open. Come back when the ${COURSE_LABELS[nextUnopenCourse].label} opens!`,
          emoji: "✅"
        };
      }
      return { title: "All done!", body: "You've placed all your orders for tonight. Enjoy the evening!", emoji: "🎉" };
    }
    return {
      title: "Previous course required",
      body: `You need to order your Starter before you can access the Main Course or Dessert.`,
      emoji: "⚠️"
    };
  };

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #1e1650 0%, #0d0826 70%)", padding: "0 0 60px" }}>
      <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, #c9a84c, #e8c97e, #c9a84c, transparent)" }} />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 32px" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "8px" }}>
          Pan-Atlantic University · Final Year Dinner
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 600, color: "#f5f0e8", marginBottom: "12px" }}>
          PAU Dinner 2026
        </h1>
        {(openCourses || []).length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
            {(openCourses || []).map((c) => (
              <div key={c} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "20px", padding: "6px 16px" }}>
                <span style={{ fontSize: "16px" }}>{COURSE_LABELS[c].emoji}</span>
                <span style={{ color: "#e8c97e", fontWeight: 600, fontSize: "0.85rem" }}>{COURSE_LABELS[c].label} open</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 20px" }}>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />)}
          </div>
        )}

        {!loading && (openCourses || []).length === 0 && (
          <div className="card" style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "3rem", marginBottom: "16px" }}>⏸</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#f5f0e8", marginBottom: "12px" }}>Ordering is Closed</h2>
            <p style={{ color: "#9b93b0", lineHeight: 1.7 }}>Please wait for the announcement before placing your order.</p>
            <p style={{ color: "#c9a84c", fontSize: "0.85rem", marginTop: "16px", fontStyle: "italic" }}>Enjoy the evening!</p>
          </div>
        )}

        {!loading && (openCourses || []).length > 0 && !nameEntered && (
          <div className="card" style={{ padding: "28px", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e", marginBottom: "20px" }}>
              Enter your details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>

              {/* Name field with autocomplete */}
              <div>
                <label className="label">Your Full Name *</label>
                <div style={{ position: "relative" }}>
                  <input
                    ref={nameInputRef}
                    className="input-field"
                    type="text"
                    placeholder="Start typing your name..."
                    value={studentName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    autoComplete="off"
                    style={{
                      outline: nameConfirmed
                        ? "1.5px solid rgba(52,211,153,0.6)"
                        : undefined,
                    }}
                  />

                  {/* Confirmed tick */}
                  {nameConfirmed && (
                    <div style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#0d0826" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                        background: "#160f3a", border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "8px", marginTop: "4px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        overflow: "hidden",
                      }}
                    >
                      {suggestions.map((name) => (
                        <button
                          key={name}
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent blur before click
                            handleSelectSuggestion(name);
                          }}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            padding: "12px 16px", background: "transparent", border: "none",
                            cursor: "pointer", color: "#f5f0e8", fontSize: "0.9rem",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            fontFamily: "var(--font-body)",
                            transition: "background 0.15s",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hint text */}
                {studentName.length > 1 && !nameConfirmed && (
                  <p style={{ fontSize: "0.72rem", color: "#e05252", marginTop: "6px" }}>
                    ⚠ Please select your name from the dropdown. Only registered final year students can order.
                  </p>
                )}
                {nameConfirmed && (
                  <p style={{ fontSize: "0.72rem", color: "#34d399", marginTop: "6px" }}>
                    ✓ Name verified — you're on the list!
                  </p>
                )}
              </div>

              <div>
                <label className="label">Table Number *</label>
                <input className="input-field" type="number" min="1" max="24" placeholder="1 – 24" value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkStudentStatus()} />
                <p style={{ fontSize: "0.75rem", color: "#9b93b0", marginTop: "6px" }}>Your table number is on your place card 🪧</p>
              </div>
            </div>
            <button className="btn-gold" onClick={checkStudentStatus} disabled={checkingStatus || !nameConfirmed}
              style={{ width: "100%", padding: "14px", opacity: (checkingStatus || !nameConfirmed) ? 0.6 : 1 }}>
              {checkingStatus ? "Checking..." : "Continue →"}
            </button>
            {!nameConfirmed && studentName.length === 0 && (
              <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#9b93b0", marginTop: "10px" }}>
                Type your name to see suggestions
              </p>
            )}
          </div>
        )}

        {!loading && nameEntered && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "12px 16px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "10px" }}>
              <div>
                <p style={{ fontWeight: 500, color: "#f5f0e8", marginBottom: "2px" }}>{studentName}</p>
                <p style={{ fontSize: "0.78rem", color: "#9b93b0" }}>Table {tableNumber}</p>
              </div>
              <button onClick={() => { setNameEntered(false); setCurrentCourse(null); setMenu({}); setSelected({}); setSelectedVariants({}); setOrderedCourses([]); }}
                style={{ background: "none", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", color: "#9b93b0", fontSize: "0.75rem", fontFamily: "var(--font-body)" }}>
                Change
              </button>
            </div>

            {(orderedCourses || []).length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                {(orderedCourses || []).map((c) => (
                  <span key={c} style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontWeight: 600 }}>
                    ✓ {COURSE_LABELS[c].label} ordered
                  </span>
                ))}
              </div>
            )}

            {!currentCourse && (() => {
              const msg = getStatusMessage();
              return (
                <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ fontSize: "3rem", marginBottom: "16px" }}>{msg.emoji}</p>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#f5f0e8", marginBottom: "12px" }}>{msg.title}</h2>
                  <p style={{ color: "#9b93b0", lineHeight: 1.7 }}>{msg.body}</p>
                </div>
              );
            })()}

            {currentCourse && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "10px 16px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{courseInfo?.emoji}</span>
                  <div>
                    <p style={{ color: "#c9a84c", fontWeight: 600, fontSize: "0.85rem" }}>Now ordering:</p>
                    <p style={{ color: "#f5f0e8", fontWeight: 600 }}>{courseInfo?.label}</p>
                  </div>
                </div>

                {Object.keys(menu || {}).length === 0 ? (
                  <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                    <p style={{ color: "#9b93b0" }}>No items available yet.</p>
                  </div>
                ) : (
                  Object.entries(menu || {}).map(([category, items]) => (
                    <div key={category} className="card" style={{ padding: "24px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "#e8c97e" }}>{category}</h2>
                        <span style={{ fontSize: "0.7rem", color: "#9b93b0", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "10px" }}>Pick one</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(Array.isArray(items) ? items : []).map((item: MenuItem) => {
                          const isSelected = selected[category] === item.id;
                          const isUnavailable = !item.isAvailable;
                          const isLow = item.quantity <= 5 && item.quantity > 0;
                          const hasVariants = (item.variants?.length ?? 0) > 0;
                          const chosenVariant = selectedVariants[item.id];

                          return (
                            <div key={item.id}>
                              <button onClick={() => !isUnavailable && handleSelect(category, item.id)} disabled={isUnavailable}
                                style={{
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                  padding: "14px 16px", borderRadius: isSelected && hasVariants ? "10px 10px 0 0" : "10px",
                                  border: "none", cursor: isUnavailable ? "not-allowed" : "pointer", width: "100%",
                                  background: isSelected ? "rgba(201,168,76,0.15)" : isUnavailable ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                                  outline: isSelected ? "1.5px solid rgba(201,168,76,0.6)" : "1.5px solid transparent",
                                  transition: "all 0.2s ease", opacity: isUnavailable ? 0.4 : 1, textAlign: "left",
                                }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: 500, color: isUnavailable ? "#9b93b0" : "#f5f0e8", textDecoration: isUnavailable ? "line-through" : "none", marginBottom: item.description ? "2px" : 0 }}>
                                    {item.name}
                                  </p>
                                  {item.description && <p style={{ fontSize: "0.8rem", color: "#9b93b0" }}>{item.description}</p>}
                                  {hasVariants && !isSelected && (
                                    <p style={{ fontSize: "0.75rem", color: "#c9a84c", marginTop: "2px" }}>Choose: {item.variants!.join(" / ")}</p>
                                  )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "12px" }}>
                                  {isLow && !isUnavailable && (
                                    <span style={{ fontSize: "0.7rem", color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)" }}>{item.quantity} left</span>
                                  )}
                                  {isUnavailable && <span style={{ fontSize: "0.7rem", color: "#e05252", background: "rgba(224,82,82,0.1)", padding: "2px 8px", borderRadius: "10px" }}>Sold out</span>}
                                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, border: isSelected ? "none" : "2px solid rgba(201,168,76,0.3)", background: isSelected ? "#c9a84c" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {isSelected && <span style={{ fontSize: "11px", color: "#0d0826", fontWeight: 700 }}>✓</span>}
                                  </div>
                                </div>
                              </button>

                              {isSelected && hasVariants && (
                                <div style={{ background: "rgba(201,168,76,0.06)", border: "1.5px solid rgba(201,168,76,0.6)", borderTop: "1px solid rgba(201,168,76,0.2)", borderRadius: "0 0 10px 10px", padding: "14px 16px" }}>
                                  <label style={{ display: "block", fontSize: "0.75rem", color: "#c9a84c", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px" }}>
                                    Choose your option *
                                  </label>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {(item.variants || []).map((variant) => {
                                      const isChosen = chosenVariant === variant;
                                      return (
                                        <button key={variant} onClick={() => handleVariantSelect(item.id, variant)}
                                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "none", cursor: "pointer", background: isChosen ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)", outline: isChosen ? "1.5px solid rgba(201,168,76,0.5)" : "1.5px solid transparent", transition: "all 0.15s ease", textAlign: "left", width: "100%" }}>
                                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, border: isChosen ? "none" : "2px solid rgba(201,168,76,0.4)", background: isChosen ? "#c9a84c" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {isChosen && <span style={{ fontSize: "9px", color: "#0d0826", fontWeight: 700 }}>✓</span>}
                                          </div>
                                          <span style={{ color: isChosen ? "#f5f0e8" : "#9b93b0", fontWeight: isChosen ? 500 : 400, fontSize: "0.9rem" }}>{variant}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}

                <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
                  <label className="label">Special Notes (Optional)</label>
                  <textarea className="input-field" rows={3} placeholder="Allergies, dietary restrictions..." value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} style={{ resize: "vertical" }} />
                </div>

                <button className="btn-gold" onClick={handleSubmit} disabled={submitting} style={{ width: "100%", fontSize: "1rem", padding: "16px", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Placing Order..." : `Place My ${courseInfo?.label} Order →`}
                </button>

                <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#9b93b0", marginTop: "16px", lineHeight: 1.6 }}>
                  Your selection is locked in immediately. Food is served on a first-come, first-served basis.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}