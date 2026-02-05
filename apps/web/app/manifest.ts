import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Project Nexus',
        short_name: 'Nexus',
        description: 'A modern communication platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#313338',
        theme_color: '#313338',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
