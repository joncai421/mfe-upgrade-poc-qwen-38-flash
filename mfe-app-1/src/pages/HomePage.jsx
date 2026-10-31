import Counter from "../components/Counter";
import ContactForm from "../components/ContactForm";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Counter />
      <ContactForm />
    </div>
  );
}
