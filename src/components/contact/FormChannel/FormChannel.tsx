import { ChannelCard } from "../ChannelCard/ChannelCard";
import { ContactForm, type ContactFormProps } from "../ContactForm/ContactForm";

interface FormChannelProps extends ContactFormProps {
  title: string;
  hint: string;
}

export function FormChannel({ title, hint, ...form }: FormChannelProps) {
  return (
    <ChannelCard id="formulario" title={title} hint={hint} wide>
      <ContactForm {...form} />
    </ChannelCard>
  );
}
