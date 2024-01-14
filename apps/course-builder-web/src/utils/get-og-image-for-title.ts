export const getOGImageUrlForTitle = (title: string) => {
  return (
    `https://res.cloudinary.com/badass-courses/image/upload/w_1200,h_630,c_fill,f_auto/w_630,h_450,c_fit,co_rgb:FFFFFF,g_west,x_45,y_-40,l_text:arial_60_bold:` +
    encodeURIComponent(title) +
    `/course-builder-og-image-template_qfarun.png`
  )
}
