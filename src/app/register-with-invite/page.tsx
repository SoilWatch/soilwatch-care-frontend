import RegisterWithInviteForm from "./RegisterWithInviteForm";

export default async function RegisterWithInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token = "", email = "" } = await searchParams;
  return <RegisterWithInviteForm token={token} email={email} />;
}
