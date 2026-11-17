import { ChannelCard } from "../ChannelCard/ChannelCard";
import { ContactForm, type ContactFormProps } from "../ContactForm/ContactForm";

interface FormChannelProps extends ContactFormProps {
  title: string;
  hint: string;
  stacked?: boolean;
}

export function FormChannel({ title, hint, stacked, ...form }: FormChannelProps) {
  return (
    <ChannelCard id="formulario" title={title} hint={hint} wide stacked={stacked}>
      <ContactForm {...form} />
    </ChannelCard>
  );
}
