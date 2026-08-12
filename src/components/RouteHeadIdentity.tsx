'use client';

import { useEffect } from 'react';

interface RouteHeadIdentityProps {
  title: string;
  icon: string;
}

export function RouteHeadIdentity({ title, icon }: RouteHeadIdentityProps) {
  useEffect(() => {
    document.title = title;

    const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]'));

    if (iconLinks.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.sizes = 'any';
      link.href = icon;
      document.head.appendChild(link);
      return;
    }

    for (const link of iconLinks) {
      link.type = 'image/png';
      link.sizes = 'any';
      link.href = icon;
    }
  }, [icon, title]);

  return null;
}
