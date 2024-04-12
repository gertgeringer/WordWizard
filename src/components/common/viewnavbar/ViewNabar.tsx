import classes from './Viewnavbar.module.css';
import React, {useEffect, useState} from 'react';
import {Text, Title} from '@mantine/core';

export interface ViewNavbarItem {
    id: number,
    label: string,
    description: string
}

interface ViewNavbarProps {
    selectedId: number | undefined,
    items: ViewNavbarItem[]
    onClick?: (item: ViewNavbarItem) => void
}

const ViewNavbar: React.FC<ViewNavbarProps> = ({
                                                   selectedId,
  items,
  onClick
}) => {

    const [activeId, setActiveId] = useState<number | undefined>();

    useEffect(() => {
        setActiveId(selectedId);
    }, [selectedId])

    return (
        <nav className={classes.navbar}>
            <div className={classes.navbarMain}>
                {items.map((item) => (
                    <a
                        className={classes.link}
                        data-active={item.id === activeId || undefined}
                        key={item.id}
                        onClick={(event) => {
                            event.preventDefault();
                            setActiveId(item.id);
                            if (onClick) {
                                onClick(item);
                            }
                        }}
                    >
                        <div>
                            <Title order={6}>{item.label}</Title>
                            <Text mt={"xs"} size={"xs"}>{item.description}</Text>
                        </div>
                    </a>
                ))}
            </div>
        </nav>
    );
}

export default ViewNavbar
