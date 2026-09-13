import { useState } from 'react';
import { Icon, VStack, Heading, Text } from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';
import { AppShell } from '../components/layout/AppShell';

interface ComingSoonPageProps {
  title: string;
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  const [search, setSearch] = useState('');

  return (
    <AppShell title={title} searchValue={search} onSearchChange={setSearch}>
      <VStack align="center" justify="center" minH="60vh" spacing={4} textAlign="center">
        <Icon as={FiClock} boxSize={10} color="surface.muted" />
        <Heading size="lg">{title}</Heading>
        <Text color="surface.muted" fontSize="sm" maxW="360px">
          This section isn&apos;t built yet — check back soon.
        </Text>
      </VStack>
    </AppShell>
  );
}
