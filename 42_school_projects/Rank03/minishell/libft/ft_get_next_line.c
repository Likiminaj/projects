/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_get_next_line.c                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/08/12 15:33:39 by cpesty            #+#    #+#             */
/*   Updated: 2025/10/29 18:47:39 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

/* Reads a line from a .txt file. Each calling sends back 
   to the next line. OPEN_MAX : one stash per fd*/

char	*get_next_line(int fd)
{
	char		*line;
	static char	*stash[10000];

	if (fd < 0 || BUFFER_SIZE <= 0 || fd >= 10000)
		return (NULL);
	read_and_save(fd, &stash[fd]);
	if (stash[fd] == NULL)
		return (NULL);
	extract_line(stash[fd], &line);
	stash[fd] = clean_stash(stash[fd]);
	if (!line || line[0] == '\0')
		return (free(line), NULL);
	return (line);
}

/* Reads the .txt file until a new line '\n' is found or 
   it is the end of the .txt file. Pass the characters to
   be saved in stash */

void	read_and_save(int fd, char **stash)
{
	char	*buffer;
	char	*new_stash;
	int		rbytes;

	rbytes = 1;
	while (!found_newline(*stash) && rbytes > 0)
	{
		buffer = malloc(BUFFER_SIZE + 1);
		if (!buffer)
			return (free_stash(stash));
		rbytes = (int)read(fd, buffer, BUFFER_SIZE);
		if (rbytes == -1)
		{
			free_stash(stash);
			return (free(buffer));
		}
		buffer[rbytes] = '\0';
		new_stash = save_in_stash(*stash, buffer, rbytes);
		if (new_stash)
			*stash = new_stash;
		else
			free_stash(stash);
		free (buffer);
	}
}

/* Copies the temporay buffer content into our permanent
   stash */

char	*save_in_stash(char *stash, char *buffer, int rbytes)
{
	int		i;
	int		j;
	char	*new_stash;

	if (stash == NULL)
	{
		new_stash = malloc(rbytes + 1);
		if (!new_stash)
			return (NULL);
		i = -1;
		while (++i < rbytes)
			new_stash[i] = buffer[i];
		return (new_stash[i] = '\0', new_stash);
	}
	new_stash = malloc(ft_strlen_gnl(stash) + rbytes + 1);
	if (!new_stash)
		return (NULL);
	i = 0;
	j = 0;
	while (stash[i] != '\0')
		new_stash[j++] = stash[i++];
	i = 0;
	while (i < rbytes && buffer[i])
		new_stash[j++] = buffer[i++];
	return (new_stash[j] = '\0', free (stash), new_stash);
}

/* Extract the complete line to display from the stash */

void	extract_line(char *stash, char **line)
{
	int	i;

	if (!stash)
		return ;
	create_line(line, stash);
	if (!(*line))
		return ;
	i = 0;
	while (stash[i] != '\0' && stash[i] != '\n')
	{
		(*line)[i] = stash[i];
		i++;
	}
	if (stash[i] == '\n')
	{
		(*line)[i] = '\n';
		i++;
	}
	(*line)[i] = '\0';
}

/* Erases the line displayed from the stash to prepare for
   next line */

char	*clean_stash(char *stash)
{
	int		i;
	int		j;
	char	*clean_stash;

	i = 0;
	j = 0;
	while (stash[i] && stash[i] != '\n')
		i++;
	if (!stash[i])
		return (free(stash), NULL);
	i++;
	clean_stash = malloc(ft_strlen_gnl(stash) - i + 1);
	if (!clean_stash)
		return (free(stash), NULL);
	while (stash[i] != '\0')
		clean_stash[j++] = stash[i++];
	clean_stash[j] = '\0';
	free (stash);
	return (clean_stash);
}
