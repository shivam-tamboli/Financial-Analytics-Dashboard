import { Box, Flex, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // Derived straight from the route rather than tracked separately — Dashboard and
  // Transactions share path '/' (they're anchors within the same page), so the first
  // match in NAV_ITEMS order ("dashboard") wins whenever the URL is just '/'.
  const active = NAV_ITEMS.find((item) => item.path === location.pathname)?.key ?? 'dashboard';

  function handleClick(path: string, targetId?: string) {
    if (targetId) {
      if (location.pathname === path) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate(path);
        // Give the target page a render pass to mount before scrolling to its section.
        setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      }
    } else {
      navigate(path);
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
              onClick={() => handleClick(item.path, item.targetId)}
              textAlign="left"
            >
              {isActive && (
                <Box position="absolute" right={-3} top={0} bottom={0} w="3px" bg="brand.500" borderRadius="full" />
              )}
              <Icon as={item.icon} boxSize={5} />
              <Text fontSize="sm" fontWeight={isActive ? 600 : 500}>
                {item.label}
              </Text>
            </Flex>
          );
        })}
      </Stack>
    </Flex>
  );
}
