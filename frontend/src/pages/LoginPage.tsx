import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { AlertChip } from '../components/common/AlertChip';

export function LoginPage() {
  const { login, isAuthenticating } = useAuth();
  const [username, setUsername] = useState('analyst');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <Flex minH="100vh" bg="surface.bg" align="center" justify="center" px={4}>
      <Box
        w="full"
        maxW="md"
        bg="surface.panel"
        border="1px solid"
        borderColor="surface.border"
        borderRadius="2xl"
        p={{ base: 6, md: 10 }}
        boxShadow="0 20px 60px rgba(0,0,0,0.4)"
      >
        <Stack spacing={1} mb={8} align="center">
          <Flex align="center" gap={2} mb={2}>
            <Flex
              boxSize={9}
              borderRadius="lg"
              bg="brand.500"
              align="center"
              justify="center"
              color="black"
              fontWeight={800}
            >
              <Icon as={FiTrendingUp} boxSize={5} />
            </Flex>
            <Heading size="lg" letterSpacing="tight">
              Penta
            </Heading>
          </Flex>
          <Text color="surface.muted" fontSize="sm" textAlign="center">
            Sign in to view your financial analytics dashboard
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {error && <AlertChip status="error" message={error} onClose={() => setError(null)} />}

            <FormControl isRequired>
              <FormLabel fontSize="sm" color="surface.muted">
                Username
              </FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="analyst"
                bg="surface.panelAlt"
                border="1px solid"
                borderColor="surface.border"
                autoComplete="username"
                _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #22c55e' }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" color="surface.muted">
                Password
              </FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  bg="surface.panelAlt"
                  border="1px solid"
                  borderColor="surface.border"
                  autoComplete="current-password"
                  _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #22c55e' }}
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon as={showPassword ? FiEyeOff : FiEye} color="surface.muted" />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              bg="brand.500"
              color="black"
              _hover={{ bg: 'brand.400' }}
              _active={{ bg: 'brand.600' }}
              size="lg"
              mt={2}
              isLoading={isAuthenticating}
              loadingText="Signing in"
            >
              Sign in
            </Button>

            <Text fontSize="xs" color="surface.muted" textAlign="center" pt={2}>
              Demo credentials — username: <b>analyst</b> · password: <b>Analyst@123</b>
            </Text>
          </Stack>
        </form>
      </Box>
    </Flex>
  );
}
