function Avatar({ firstName, lastName, size = 'regular' }) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  const tone = ((firstName?.charCodeAt(0) ?? 0) + (lastName?.charCodeAt(0) ?? 0)) % 5

  return (
    <span className={`avatar avatar-${tone} avatar-${size}`} aria-hidden="true">
      {initials}
    </span>
  )
}

export default Avatar
