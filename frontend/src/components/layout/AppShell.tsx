import type { ReactNode } from 'react';
import {
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  useDisclosure,
} from '@chakra-ui/react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function AppShell({ children, searchValue, onSearchChange }: AppShellProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minH="100vh" bg="surface.bg">
      <Box display={{ base: 'none', lg: 'block' }} w="260px" flexShrink={0}>
        <Box position="fixed" w="260px" h="100vh">
          <Sidebar />
        </Box>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="260px" bg="surface.panel">
          <Sidebar onNavigate={onClose} />
        </DrawerContent>
      </Drawer>

      <Box flex={1} minW={0} id="top">
        <Topbar onOpenMenu={onOpen} searchValue={searchValue} onSearchChange={onSearchChange} />
        <Box px={{ base: 4, md: 8 }} pb={12}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
