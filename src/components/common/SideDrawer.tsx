import React from "react";
import {Drawer} from "@mantine/core";

interface SideDrawerProps {
    title: string,
    opened: boolean,
    onClose: () => void,
    children: React.ReactNode;
}

const SideDrawer: React.FC<SideDrawerProps> = ({
    title,
    opened,
                                                   onClose,
                                                   children
}) => {
    return (
        <Drawer opened={opened} onClose={onClose} position="right" title={title} size={"md"}>
            {children}
        </Drawer>
    );
}

export default SideDrawer;