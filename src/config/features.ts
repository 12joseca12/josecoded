interface Features {
  search: boolean;
  googleSignIn: boolean;
  cvDownload: boolean;
  blog: boolean;
  chat: boolean;
  projects: boolean;
}

export const features: Features = {
  search: false,
  googleSignIn: false,
  cvDownload: true,
  blog: false,
  chat: false,
  projects: true,
};
