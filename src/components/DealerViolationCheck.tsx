"use client";

import { useState } from "react";
import {
  OMVIC_RULES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  OmvicRule,
  AutoViolation,
  ViolationCategory,
} from "@/lib/omvic-rules";

interface Props {
  autoViolations: AutoViolation[];
}

type Answer = "yes" | "no" | null;

export default function DealerViolationCheck({ autoViolations }: Props) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [currentCategory, setCurrentCategory] =
    useState<ViolationCategory | null>(null);
  const [done, setDone] = useState(false);

  // Group rules by category
  const rulesByCategory: Record<ViolationCategory, OmvicRule[]> = {} as Record<
    ViolationCategory,
    OmvicRule[]
  >;
  for (const cat of CATEGORY_ORDER) {
    rulesByCategory[cat] = OMVIC_RULES.filter((r) => r.category === cat);
  }

  const setAnswer = (id: string, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [id]: answer }));
  };

  // Collect violations
  const triggeredRules = OMVIC_RULES.filter(
    (rule) => answers[rule.id] === rule.violationAnswer
  );
  const allViolations = [...autoViolations.map(autoToDisplay), ...triggeredRules.map(ruleToDisplay)];
  const seriousCount = allViolations.filter((v) => v.severity === "serious").length;

  if (!started) {
    return (
      <section>
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            setCurrentCategory(CATEGORY_ORDER[0]);
          }}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-5 text-left hover:border-gray-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Did the Dealer Break Any Rules?
              </h3>
              <p className="text-sm text-gray-400">
                Quick checklist based on OMVIC regulations &amp; Ontario consumer
                protection law. Answer a few yes/no questions.
              </p>
            </div>
            <span className="text-gray-600 group-hover:text-emerald-400 transition-colors text-2xl">
              &rsaquo;
            </span>
          </div>
          {autoViolations.length > 0 && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-sm text-red-400">
                {autoViolations.length} potential issue{autoViolations.length > 1 ? "s" : ""} already
                detected from your numbers
              </p>
            </div>
          )}
        </button>
      </section>
    );
  }

  if (done) {
    return (
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          OMVIC Compliance Check
        </h3>

        {allViolations.length === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center">
            <p className="text-emerald-400 font-semibold text-lg mb-1">
              No violations detected
            </p>
            <p className="text-sm text-gray-400">
              Based on your answers and the deal numbers, the dealer appears to
              be following OMVIC regulations. This doesn&apos;t guarantee
              compliance, but no red flags were found.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`${seriousCount > 0 ? "bg-red-500/10 border-red-500/30" : "bg-yellow-500/10 border-yellow-500/30"} border rounded-xl p-5 text-center`}
            >
              <p
                className={`${seriousCount > 0 ? "text-red-400" : "text-yellow-400"} font-semibold text-lg mb-1`}
              >
                {allViolations.length} potential violation
                {allViolations.length > 1 ? "s" : ""} found
              </p>
              {seriousCount > 0 && (
                <p className="text-sm text-gray-400">
                  {seriousCount} serious. You may want to file an OMVIC
                  complaint.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {allViolations.map((v) => (
                <div
                  key={v.id}
                  className={`border rounded-xl p-4 ${
                    v.severity === "serious"
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-yellow-500/40 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs uppercase font-bold tracking-wider ${
                        v.severity === "serious"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {v.severity}
                    </span>
                    <span className="text-xs text-gray-600">
                      {v.regulation}
                    </span>
                  </div>
                  <h4 className="text-white font-semibold mb-1">{v.title}</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    {v.explanation}
                  </p>
                  <div className="bg-black/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      What you can do
                    </p>
                    <p className="text-sm text-gray-300">{v.remedy}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">
                <span className="text-white font-medium">
                  File an OMVIC complaint:
                </span>{" "}
                omvic.ca/complaints or call 1-800-943-6002
              </p>
              <p className="text-xs text-gray-600">
                Time limit: generally 2 years from when you knew or should have
                known about the issue. Keep copies of all documents.
              </p>
            </div>
          </>
        )}

        <button
          onClick={() => {
            setDone(false);
            setCurrentCategory(CATEGORY_ORDER[0]);
          }}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Redo checklist
        </button>
      </section>
    );
  }

  // Active Q&A mode — show one category at a time
  const catIndex = currentCategory
    ? CATEGORY_ORDER.indexOf(currentCategory)
    : 0;
  const questions = currentCategory ? rulesByCategory[currentCategory] : [];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const goNext = () => {
    const next = catIndex + 1;
    if (next >= CATEGORY_ORDER.length) {
      setDone(true);
      setCurrentCategory(null);
    } else {
      setCurrentCategory(CATEGORY_ORDER[next]);
    }
  };

  const skipAll = () => {
    setDone(true);
    setCurrentCategory(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Did the Dealer Break Any Rules?
        </h3>
        <button
          onClick={skipAll}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Skip to results
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {CATEGORY_ORDER.map((cat, i) => (
          <div
            key={cat}
            className={`flex-1 h-1 rounded-full ${
              i < catIndex
                ? "bg-emerald-500"
                : i === catIndex
                  ? "bg-emerald-500/50"
                  : "bg-gray-800"
            }`}
          />
        ))}
      </div>

      {/* Category header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {catIndex + 1} of {CATEGORY_ORDER.length}
        </p>
        <h4 className="text-white font-medium">
          {currentCategory && CATEGORY_LABELS[currentCategory]}
        </h4>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((rule) => (
          <div
            key={rule.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
          >
            <p className="text-sm text-gray-300 mb-3">{rule.question}</p>
            <div className="flex gap-2">
              <AnswerButton
                label="Yes"
                selected={answers[rule.id] === "yes"}
                isViolation={rule.violationAnswer === "yes"}
                onClick={() => setAnswer(rule.id, "yes")}
              />
              <AnswerButton
                label="No"
                selected={answers[rule.id] === "no"}
                isViolation={rule.violationAnswer === "no"}
                onClick={() => setAnswer(rule.id, "no")}
              />
              <button
                type="button"
                onClick={() => setAnswer(rule.id, answers[rule.id] === null ? "no" : null)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2"
              >
                Not sure
              </button>
            </div>
            {/* Inline warning if violation detected */}
            {answers[rule.id] === rule.violationAnswer && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-xs text-red-400 font-medium">
                  {rule.severity === "serious"
                    ? "Serious violation"
                    : "Potential issue"}{" "}
                  — {rule.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {rule.regulation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Next category */}
      <button
        type="button"
        onClick={goNext}
        disabled={!allAnswered}
        className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
          allAnswered
            ? "bg-emerald-500 hover:bg-emerald-400 text-black"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        }`}
      >
        {catIndex + 1 >= CATEGORY_ORDER.length ? "See Results" : "Next Section"}
      </button>
    </section>
  );
}

function AnswerButton({
  label,
  selected,
  isViolation,
  onClick,
}: {
  label: string;
  selected: boolean;
  isViolation: boolean;
  onClick: () => void;
}) {
  let classes = "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ";
  if (selected) {
    classes += isViolation
      ? "bg-red-500/20 text-red-400 border border-red-500/40"
      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
  } else {
    classes += "bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700 hover:text-gray-300";
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {label}
    </button>
  );
}

interface DisplayViolation {
  id: string;
  title: string;
  severity: "serious" | "moderate";
  regulation: string;
  explanation: string;
  remedy: string;
}

function autoToDisplay(v: AutoViolation): DisplayViolation {
  return v;
}

function ruleToDisplay(r: OmvicRule): DisplayViolation {
  return {
    id: r.id,
    title: r.title,
    severity: r.severity,
    regulation: r.regulation,
    explanation: r.explanation,
    remedy: r.remedy,
  };
}
