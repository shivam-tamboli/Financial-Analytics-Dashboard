import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiLogOut } from 'react-icons/fi';
import { useState } from 'react';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [active, setActive] = useState('dashboard');
  const { user, logout } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  function handleClick(key: string, targetId?: string) {
    setActive(key);
    if (key === 'setting') {
      onOpen();
      return;
    }
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      toast({
        title: 'Coming soon',
        description: 'This section is outside the assignment scope.',
        status: 'info',
        duration: 2500,
        isClosable: true,
      });
    }
    onNavigate?.();
  }

  return (
    <Flex direction="column" h="full" bg="surface.panel" borderRight="1px solid" borderColor="surface.border" py={6}>
      <Flex align="center" gap={2} px={6} mb={10}>
        <Box as="img" src="/Pentalogo.png" alt="Penta" boxSize={8} objectFit="contain" />
        <Heading size="md" letterSpacing="tight">
          Penta
        </Heading>
      </Flex>

      <Stack spacing={1} px={3} flex={1}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Flex
              key={item.key}
              as="button"
              align="center"
              gap={3}
              px={3}
              py={2.5}
              borderRadius="lg"
              cursor="pointer"
              position="relative"
              bg={isActive ? 'rgba(34,197,94,0.12)' : 'transparent'}
              color={isActive ? 'brand.400' : 'surface.muted'}
              _hover={{ bg: 'rgba(128,128,128,0.08)', color: isActive ? 'brand.400' : 'text.primary' }}
              onClick={() => handleClick(item.key, item.targetId)}
              textAlign="left"
            >
              {isActive && (
                <Box position="absolute" right={-3} top={0} bottom={0} w="3px" bg="brand.500" borderRadius="full" />
              )}
              <Icon as={item.icon} boxSize={4.5} />
              <Text fontSize="sm" fontWeight={isActive ? 600 : 500}>
                {item.label}
              </Text>
            </Flex>
          );
        })}
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="surface.panel" border="1px solid" borderColor="surface.border">
          <ModalHeader>Account settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={1}>
              <Text fontSize="sm" color="surface.muted">
                Signed in as
              </Text>
              <Text fontWeight={600}>{user?.name}</Text>
              <Text fontSize="sm" color="surface.muted">
                @{user?.username}
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button leftIcon={<FiLogOut />} colorScheme="red" variant="outline" onClick={logout} w="full">
              Log out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
