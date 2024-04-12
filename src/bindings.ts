         // This file was generated by [tauri-specta](https://github.com/oscartbeaumont/tauri-specta). Do not edit this file manually.

         export const commands = {
async getAllStudents() : Promise<Student[]> {
return await TAURI_INVOKE("plugin:tauri-specta|get_all_students");
},
async createStudent(firstName: string, lastName: string) : Promise<__Result__<{ id: number; first_name: string; last_name: string }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|create_student", { firstName, lastName }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async updateStudent(studentId: number, firstName: string, lastName: string) : Promise<__Result__<{ id: number; first_name: string; last_name: string }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|update_student", { studentId, firstName, lastName }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async deleteStudent(studentId: number) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|delete_student", { studentId }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async getAllDecks() : Promise<Deck[]> {
return await TAURI_INVOKE("plugin:tauri-specta|get_all_decks");
},
async createDeck(title: string, description: string) : Promise<__Result__<{ id: number; title: string; description: string; cards: Card[] }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|create_deck", { title, description }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async getDeck(deckId: number) : Promise<Deck> {
return await TAURI_INVOKE("plugin:tauri-specta|get_deck", { deckId });
},
async saveCardToDeck(card: DeckCard) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|save_card_to_deck", { card }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async updateDeck(deck: Deck) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|update_deck", { deck }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async createAssessment(title: string, students: Student[], cards: Card[], durationInSec: number) : Promise<__Result__<{ id: number; title: string; students: Student[]; cards: Card[]; duration_in_sec: number; student_evaluations: StudentEvaluation[] }, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|create_assessment", { title, students, cards, durationInSec }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async getAllAssessments() : Promise<AssessmentWithStatus[]> {
return await TAURI_INVOKE("plugin:tauri-specta|get_all_assessments");
},
async getAssessment(assessmentId: number) : Promise<Assessment> {
return await TAURI_INVOKE("plugin:tauri-specta|get_assessment", { assessmentId });
},
async deleteAssessment(assessmentId: number) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|delete_assessment", { assessmentId }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async deleteDeck(deckId: number) : Promise<__Result__<null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|delete_deck", { deckId }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async deleteCard(deckId: number, cardId: number) : Promise<__Result__<number, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|delete_card", { deckId, cardId }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async cardReadEnd(studentId: number, assessmentId: number) : Promise<{ card: Card; start_date_str: string | null; end_date_str: string | null } | null> {
return await TAURI_INVOKE("plugin:tauri-specta|card_read_end", { studentId, assessmentId });
},
async startEvaluation(assessmentId: number, studentId: number) : Promise<{ student_name: string; active_card: CardEvaluation; card_read_duration_in_sec: number } | null> {
return await TAURI_INVOKE("plugin:tauri-specta|start_evaluation", { assessmentId, studentId });
},
async stopEvaluation(assessmentId: number, studentId: number) : Promise<__Result__<{ evaluation_time_in_ms: number; cards_read_count: number } | null, string>> {
try {
    return { status: "ok", data: await TAURI_INVOKE("plugin:tauri-specta|stop_evaluation", { assessmentId, studentId }) };
} catch (e) {
    if(e instanceof Error) throw e;
    else return { status: "error", error: e  as any };
}
},
async getAllStudentEvaluations(student: Student) : Promise<number[]> {
return await TAURI_INVOKE("plugin:tauri-specta|get_all_student_evaluations", { student });
}
}



/** user-defined types **/

export type Assessment = { id: number; title: string; students: Student[]; cards: Card[]; duration_in_sec: number; student_evaluations: StudentEvaluation[] }
export type AssessmentState = "NotStarted" | "InProgress" | "Completed"
export type AssessmentStatus = { state: AssessmentState; progress: number }
export type AssessmentWithStatus = { assessment: Assessment; status: AssessmentStatus }
export type Card = { id: number; text: string; image_file_path: string | null }
export type CardEvaluation = { card: Card; start_date_str: string | null; end_date_str: string | null }
export type Deck = { id: number; title: string; description: string; cards: Card[] }
export type DeckCard = { deck_id: number; card_text: string; image_file_path: string | null }
export type Student = { id: number; first_name: string; last_name: string }
export type StudentEvaluation = { student: Student; state: AssessmentState; card_evaluations: CardEvaluation[]; card_read_order_queue: number[]; result: StudentEvaluationResult | null }
export type StudentEvaluationResult = { evaluation_time_in_ms: number; cards_read_count: number }

/** tauri-specta globals **/

         import { invoke as TAURI_INVOKE } from "@tauri-apps/api";
import * as TAURI_API_EVENT from "@tauri-apps/api/event";
import { type WebviewWindowHandle as __WebviewWindowHandle__ } from "@tauri-apps/api/window";

type __EventObj__<T> = {
  listen: (
    cb: TAURI_API_EVENT.EventCallback<T>
  ) => ReturnType<typeof TAURI_API_EVENT.listen<T>>;
  once: (
    cb: TAURI_API_EVENT.EventCallback<T>
  ) => ReturnType<typeof TAURI_API_EVENT.once<T>>;
  emit: T extends null
    ? (payload?: T) => ReturnType<typeof TAURI_API_EVENT.emit>
    : (payload: T) => ReturnType<typeof TAURI_API_EVENT.emit>;
};

type __Result__<T, E> =
  | { status: "ok"; data: T }
  | { status: "error"; error: E };

function __makeEvents__<T extends Record<string, any>>(
  mappings: Record<keyof T, string>
) {
  return new Proxy(
    {} as unknown as {
      [K in keyof T]: __EventObj__<T[K]> & {
        (handle: __WebviewWindowHandle__): __EventObj__<T[K]>;
      };
    },
    {
      get: (_, event) => {
        const name = mappings[event as keyof T];

        return new Proxy((() => {}) as any, {
          apply: (_, __, [window]: [__WebviewWindowHandle__]) => ({
            listen: (arg: any) => window.listen(name, arg),
            once: (arg: any) => window.once(name, arg),
            emit: (arg: any) => window.emit(name, arg),
          }),
          get: (_, command: keyof __EventObj__<any>) => {
            switch (command) {
              case "listen":
                return (arg: any) => TAURI_API_EVENT.listen(name, arg);
              case "once":
                return (arg: any) => TAURI_API_EVENT.once(name, arg);
              case "emit":
                return (arg: any) => TAURI_API_EVENT.emit(name, arg);
            }
          },
        });
      },
    }
  );
}

     