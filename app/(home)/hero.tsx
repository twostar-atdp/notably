import { Form } from "./form";

export function Hero() {
  return (
    <div className="flex flex-col items-center justify-start w-full min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-130px)] p-5">
      <div className="w-full max-w-2xl mx-auto text-center mb-8">
        <h2 className="text-xl text-gray-900 md:text-3xl mb-4">
          Leave a note, we'll build the tracks
        </h2>
        <Form />
      </div>
    </div>
  );
}