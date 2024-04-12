import React from 'react';
import { UnstyledButton, Tooltip, rem, Stack } from '@mantine/core';
import {
  IconHome2,
  IconUser,
  IconCards,
  IconReport,
} from '@tabler/icons-react';
import classes from './Navbar.module.css';
import {useLocation, useNavigate} from 'react-router-dom';

const data = [
  { icon: IconUser, label: 'Students', path: '/students' },
  { icon: IconCards, label: 'Decks', path: '/decks' },
  { icon: IconReport, label: 'Assessments', path: '/assessments' },
];

const Navbar: React.FC = (
) => {

  const location = useLocation();
  const navigate = useNavigate();

  function onLinkClick(link: NavbarLinkProps) {
    navigate(link.path);
  }

  interface NavbarLinkProps {
    icon: typeof IconHome2;
    path: string;
    label: string;
    active?: boolean;
    onClick?(): void;
  }

  const NavbarLink = ({ icon: Icon, label, active, onClick }: NavbarLinkProps) => {
    return (
      <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
        <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
          <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
        </UnstyledButton>
      </Tooltip>
    );
  }

  const links = data.map((link) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={link.path === location.pathname}
      path={link.path}
      onClick={() => onLinkClick(link)}
    />
  ));

  return (
    <Stack justify="center" gap={0} p={0}>
      {links}
    </Stack>
  );
}

export default Navbar
