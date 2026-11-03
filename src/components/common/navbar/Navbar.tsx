import React from 'react';
import {Button, Group} from '@mantine/core';
import {IconCards, IconSettings, IconUsers} from '@tabler/icons-react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useI18n} from '../../../i18n';
import {TranslationKey} from '../../../i18n/en';

const links: { icon: typeof IconUsers, label: TranslationKey, path: string }[] = [
    {icon: IconUsers, label: 'navStudents', path: '/students'},
    {icon: IconCards, label: 'navDecks', path: '/decks'},
    {icon: IconSettings, label: 'navSettings', path: '/settings'},
];

const Navbar: React.FC = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const {t} = useI18n();

    return (
        <Group gap="xs">
            {links.map(({icon: Icon, label, path}) => {
                const active = location.pathname.startsWith(path);
                return (
                    <Button
                        key={path}
                        size="md"
                        variant={active ? "light" : "subtle"}
                        color={active ? undefined : "gray"}
                        leftSection={<Icon size={20}/>}
                        onClick={() => navigate(path)}
                    >
                        {t(label)}
                    </Button>
                );
            })}
        </Group>
    );
}

export default Navbar
