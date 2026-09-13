import {
  Avatar,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { FiBell, FiLogOut, FiMenu, FiMoon, FiSearch, FiSun } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onOpenMenu: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function Topbar({ onOpenMenu, searchValue, onSearchChange }: TopbarProps) {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Flex align="center" justify="space-between" gap={4} px={{ base: 4, md: 8 }} py={5} wrap="wrap">
      <Flex align="center" gap={3}>
        <IconButton
          display={{ base: 'inline-flex', lg: 'none' }}
          aria-label="Open menu"
          icon={<FiMenu />}
          variant="ghost"
          onClick={onOpenMenu}
        />
        <Heading size="lg" letterSpacing="tight">
          Dashboard
        </Heading>
      </Flex>

      <Flex align="center" gap={3} flex={1} justify="flex-end" minW={0}>
        <InputGroup maxW="280px" display={{ base: 'none', md: 'flex' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="surface.muted" boxSize={4} />
          </InputLeftElement>
          <Input
            placeholder="Search transactions..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            bg="surface.panel"
            border="1px solid"
            borderColor="surface.border"
            _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #22c55e' }}
          />
        </InputGroup>

        <IconButton
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          icon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
          variant="ghost"
          borderRadius="full"
          bg="surface.panel"
          border="1px solid"
          borderColor="surface.border"
          onClick={toggleColorMode}
        />

        <IconButton
          aria-label="Notifications"
          icon={<FiBell />}
          variant="ghost"
          borderRadius="full"
          bg="surface.panel"
          border="1px solid"
          borderColor="surface.border"
        />

        <Menu>
          <MenuButton>
            <Avatar size="sm" name={user?.name} bg="brand.500" color="black" />
          </MenuButton>
          <MenuList bg="surface.panel" borderColor="surface.border">
            <Flex direction="column" px={3} py={1}>
              <Text fontWeight={600} fontSize="sm">
                {user?.name}
              </Text>
              <Text fontSize="xs" color="surface.muted">
                @{user?.username}
              </Text>
            </Flex>
            <MenuDivider borderColor="surface.border" />
            <MenuItem icon={<FiLogOut />} onClick={logout} bg="transparent" _hover={{ bg: 'surface.panelAlt' }}>
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
}
